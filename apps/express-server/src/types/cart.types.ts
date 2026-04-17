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

export type CreateCartDTO = {
    items: GetCartQueryReturn['items'][number]['product'][];
    totalItems: GetCartQueryReturn['_count']['items'];
    totalPrice: number;
}