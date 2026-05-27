import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { DisputeStatus } from "../../types/prisma.js";
import {
  createDispute,
  getMyDisputes,
  getAdminDisputes,
  updateDisputeStatus,
} from "./dispute.service.js";

export const createDisputeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { orderId, reason, details } = req.body;

    const dispute = await createDispute(user.id, {
      orderId,
      reason,
      details,
    });

    res.status(201).json(dispute);
  } catch (error) {
    next(error);
  }
};

export const getMyDisputesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const disputes = await getMyDisputes(user.id);
    res.status(200).json(disputes);
  } catch (error) {
    next(error);
  }
};

export const getAdminDisputesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status =
      typeof req.query.status === "string"
        ? (req.query.status as DisputeStatus)
        : undefined;
    const buyerId =
      typeof req.query.buyerId === "string" ? req.query.buyerId : undefined;
    const sellerId =
      typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
    const orderId =
      typeof req.query.orderId === "string" ? req.query.orderId : undefined;

    const result = await getAdminDisputes({
      page,
      pageSize,
      status,
      buyerId,
      sellerId,
      orderId,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateDisputeStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const dispute = await updateDisputeStatus(
      req.params.disputeId,
      status as DisputeStatus
    );
    res.status(200).json(dispute);
  } catch (error) {
    next(error);
  }
};
