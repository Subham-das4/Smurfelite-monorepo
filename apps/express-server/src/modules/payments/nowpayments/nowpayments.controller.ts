import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { AuthenticatedRequest } from "../../../types/auth.types.js";
import { createInvoiceForOrder, processNowPaymentsIpn } from "./nowpayments.service.js";
import ApiError from "../../../utils/errors.js";

export const nowPaymentsInvoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment requests, please try again later." },
});

export const createNowPaymentsInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { internalOrderId } = req.body as { internalOrderId: string };
    const result = await createInvoiceForOrder(internalOrderId, user.id);
    res.status(200).json({
      invoiceUrl: result.invoiceUrl,
      invoiceId: result.invoiceId,
    });
  } catch (error) {
    next(error);
  }
};

export const nowPaymentsIpnController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Invalid IPN body.", 400);
    }
    const signature =
      req.headers["x-nowpayments-sig"] ?? req.headers["x-nowpayments-signature"];
    const sig = Array.isArray(signature) ? signature[0] : signature;
    await processNowPaymentsIpn(body as Record<string, unknown>, sig);
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};
