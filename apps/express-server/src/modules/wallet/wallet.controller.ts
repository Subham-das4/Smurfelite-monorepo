import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import {
  getWalletForUser,
  getWalletLedger,
  listAdminWallets,
  getAdminWallet,
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

export async function getMyWalletLedgerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getWalletLedger(user.id, page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listAdminWalletsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string | undefined;
    const result = await listAdminWallets(page, pageSize, search);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminWalletController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const wallet = await getAdminWallet(req.params.sellerId);
    res.status(200).json(wallet);
  } catch (error) {
    next(error);
  }
}

export async function getAdminWalletLedgerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getWalletLedger(req.params.sellerId, page, pageSize);
    res.status(200).json(result);
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
