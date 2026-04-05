import prisma from "../../lib/prisma.js";
import { CreateCartDTO, GetCartQueryReturn } from "../../types/cart.types.js";
import { createCartDTO } from "./cart.utils.js";

export const createCart = async (userId: string) => {
    const cart = await prisma.cart.create({
        data: { userId, items: { create: [] } },
    });
    return cart;
}

export const getCart = async (userId: string): Promise<CreateCartDTO> => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            _count: true,
            items: {
                include: {
                    product: {
                        omit: {
                            accountEmail: true,
                            accountEmailPassword: true,
                            accountPassword: true,
                            accountUsername: true,
                        }
                    },
                }
            }
        },
    });

    return createCartDTO(cart as GetCartQueryReturn);
}

export const addToCart = async (userId: string, productId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    });
    if (!cart) {
        throw new Error("Cart not found");
    }
    const cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: 1 },
    });
    return cartItem;
}

export const removeFromCart = async (userId: string, productId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
    });
    if (!cart) {
        throw new Error("Cart not found");
    }
    const cartItem = await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    return cartItem;
}