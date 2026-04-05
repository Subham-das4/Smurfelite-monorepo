import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { Role, OrderStatus } from "@smurfelite/types";
import {
  createOrder,
  getOrderById,
  getBuyerOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderCredentials,
} from "./orders.services.js";
import ApiError from "../../utils/errors.js";

export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new ApiError("productIds must be a non-empty array.", 400);
    }
    const order = await createOrder(user.id, productIds);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const isAdmin = user.role === Role.ADMIN;
    const order = await getOrderById(req.params.orderId, user.id, isAdmin);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getBuyerOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const orders = await getBuyerOrders(user.id);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await getAllOrders(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    if (!status || !Object.values(OrderStatus).includes(status)) {
      throw new ApiError(
        `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`,
        400
      );
    }
    const order = await updateOrderStatus(req.params.orderId, status);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const cancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const order = await cancelOrder(req.params.orderId, user.id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrderCredentialsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as unknown as AuthenticatedRequest;
    const credentials = await getOrderCredentials(
      req.params.orderId,
      user.id
    );
    res.status(200).json(credentials);
  } catch (error) {
    next(error);
  }
};
