import prisma from "../../lib/prisma.js";
import { CreateCartDTO, GetCartQueryReturn } from "../../types/cart.types.js";
import { createCartDTO } from "./cart.utils.js";
import ApiError from "../../utils/errors.js";
import { PUBLIC_LISTABLE_PRODUCT_WHERE } from "../product/product.constants.js";

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

    const listable = await prisma.product.findFirst({
        where: { id: productId, ...PUBLIC_LISTABLE_PRODUCT_WHERE },
        select: { id: true },
    });
    if (!listable) {
        throw new ApiError("Product is not available for purchase.", 400);
    }

    const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (existing) {
        throw new ApiError("Product is already in your cart", 409);
    }

    await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: 1 },
    });
    return getCart(userId);
}

export const removeFromCart = async (userId: string, productId: string) => {
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });
    return getCart(userId);
}

/** Remove all items from the buyer's cart (e.g. after successful checkout). */
export const clearCartItems = async (userId: string) => {
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
    });
    return getCart(userId);
}