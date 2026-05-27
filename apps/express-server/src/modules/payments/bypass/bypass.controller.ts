import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../types/auth.types.js";
import { completeBypassPayment } from "./bypass.service.js";
import { isPaymentBypassEnabled } from "../../../lib/payment-bypass.js";

export const bypassStatusController = (_req: Request, res: Response) => {
  res.status(200).json({ enabled: isPaymentBypassEnabled() });
};

export const completeBypassPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { internalOrderId } = req.body as { internalOrderId: string };
    const order = await completeBypassPayment(internalOrderId, user.id);
    res.status(200).json({ message: "Payment bypass completed.", order });
  } catch (error) {
    next(error);
  }
};
