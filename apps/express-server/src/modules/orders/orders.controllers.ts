import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { createOrder } from "./orders.services.js";

export const createOrderController = async (request: Request, res: Response, next: NextFunction) => {
    try {
        const req = request as unknown as AuthenticatedRequest;
        const { productIds } = req.body;
        const userId = req.user.id;
        const order = await createOrder(userId, productIds);
        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};