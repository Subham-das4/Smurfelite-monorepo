import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { createDispute, getMyDisputes } from "./dispute.service.js";

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
