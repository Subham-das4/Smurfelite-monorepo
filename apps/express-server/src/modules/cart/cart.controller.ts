import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../types/auth.types.js";
import { getCart, addToCart, removeFromCart } from "./cart.service.js";

export const getCartController = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as unknown as AuthenticatedRequest;
    try {
        const cart = await getCart(user.id);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
}

export const addToCartController = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as unknown as AuthenticatedRequest;
    const { productId } = req.params;
    try {
        const cart = await addToCart(user.id, productId);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
}

export const removeFromCartController = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req as unknown as AuthenticatedRequest;
    const { productId } = req.params;
    try {
        const cart = await removeFromCart(user.id, productId);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
}