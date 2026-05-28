import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { SellerApprovalStatus } from "../../types/prisma.js";
import {
  createSellerInvite,
  listSellers,
  approveSeller,
  rejectSeller,
} from "./seller.service.js";

export async function createSellerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { email, name } = req.body;
    const seller = await createSellerInvite(user.id, { email, name });
    res.status(201).json({ seller });
  } catch (error) {
    next(error);
  }
}

export async function listSellersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const status =
      (req.query.status as SellerApprovalStatus) ||
      SellerApprovalStatus.PENDING;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await listSellers(status, page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function approveSellerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const seller = await approveSeller(req.params.sellerId);
    res.status(200).json({ seller });
  } catch (error) {
    next(error);
  }
}

export async function rejectSellerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { note } = req.body;
    const seller = await rejectSeller(req.params.sellerId, note);
    res.status(200).json({ seller });
  } catch (error) {
    next(error);
  }
}
