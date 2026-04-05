import prisma from "../../lib/prisma.js";
import { CreateCartDTO, GetCartQueryReturn } from "../../types/cart.types.js";
import { createCartDTO } from "./cart.utils.js";

export const createCart = async (userId: string) => {
    const cart = await prisma.cart.create({
        data: { userId, items: { create: [] } },
    });
    return cart;
}

/** Find the user's cart, or create one on the fly if it doesn't exist yet. */
const getOrCreateCart = async (userId: string) => {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId, items: { create: [] } } });
};

export const getCart = async (userId: string): Promise<CreateCartDTO> => {
    // Auto-create the cart if it doesn't exist yet (handles legacy / OAuth-linked accounts)
    await getOrCreateCart(userId);

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
    // Auto-create the cart if it doesn't exist yet
    const cart = await getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: 1 },
    });
    return cartItem;
}

export const removeFromCart = async (userId: string, productId: string) => {
    const cart = await getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    return cartItem;
}