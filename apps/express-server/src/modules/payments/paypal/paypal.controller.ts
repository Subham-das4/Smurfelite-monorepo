import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { AuthenticatedRequest } from "../../../types/auth.types.js";
import { isPayPalEnabled } from "../../../lib/paypal-config.js";
import {
  capturePayPalOrder,
  createPayPalOrder,
} from "./paypal.service.js";

export const paypalPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment requests, please try again later." },
});

export const paypalStatusController = (
  _req: Request,
  res: Response
): void => {
  res.status(200).json({ enabled: isPayPalEnabled() });
};

export const createPayPalOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { internalOrderId } = req.body as { internalOrderId: string };
    const result = await createPayPalOrder(internalOrderId, user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const capturePayPalOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { paypalOrderId, internalOrderId } = req.body as {
      paypalOrderId: string;
      internalOrderId: string;
    };
    const order = await capturePayPalOrder(
      paypalOrderId,
      internalOrderId,
      user.id
    );

    res.status(200).json({
      message: "Payment captured. Your order is complete.",
      order,
    });
  } catch (error) {
    next(error);
  }
};
