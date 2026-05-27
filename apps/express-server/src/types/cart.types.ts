import * as PrismaNamespace from "./prisma.js";

export type GetCartQueryReturn = ({
    items: ({
        product: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gameType: string;
            title: string;
            description: string | null;
            price: number;
            isAvailable: boolean;
            specifications: PrismaNamespace.Prisma.JsonValue;
            sellerId: string;
            imageUrl: string | null;
        };
    } & {
        productId: string;
        quantity: number;
        cartId: string;
    })[];
    _count: {
        user: number;
        items: number;
    };
} & {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
})

/** Line item shape aligned with client `CartItemResponse` / `CartResponse`. */
export type CartLineItemDTO = {
    cartId: string;
    productId: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        gameType: string;
        price: number;
        specifications: Record<string, unknown>;
        imageUrl: string | null;
    };
};

/** Full cart payload for GET/POST/DELETE cart responses. */
export type CreateCartDTO = {
    items: CartLineItemDTO[];
    count: number;
    totalPrice: number;
};