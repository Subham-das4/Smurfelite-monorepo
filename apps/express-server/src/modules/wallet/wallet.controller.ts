import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import {
  getWalletForUser,
  recordSellerPayout,
} from "./wallet.service.js";

export async function getMyWalletController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const wallet = await getWalletForUser(user.id);
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}

export async function recordPayoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { amount, note } = req.body;
    const wallet = await recordSellerPayout(req.params.sellerId, amount, note);
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}
