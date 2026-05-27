import type { CreateCartDTO, GetCartQueryReturn } from "../../types/cart.types.js";
import type { Prisma } from "../../types/prisma.js";

function specificationsToRecord(value: Prisma.JsonValue): Record<string, unknown> {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

export const createCartDTO = (cart: GetCartQueryReturn): CreateCartDTO => {
    const items = cart.items.map((row) => ({
        cartId: row.cartId,
        productId: row.productId,
        quantity: row.quantity,
        product: {
            id: row.product.id,
            title: row.product.title,
            gameType: row.product.gameType,
            price: row.product.price,
            specifications: specificationsToRecord(row.product.specifications),
            imageUrl: row.product.imageUrl ?? null,
        },
    }));
    const totalPrice = items.reduce(
        (acc, row) => acc + row.product.price * row.quantity,
        0,
    );
    return {
        items,
        count: cart._count.items,
        totalPrice,
    };
};
