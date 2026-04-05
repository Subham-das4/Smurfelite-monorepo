import { Product } from "@smurfelite/types";
import { prisma } from "../../lib/prisma.js";
import ApiError from "../../utils/errors.js";

export const createOrder = async (userId: string, productIds: string[]) => {
    // 1. Group duplicates to handle quantities (e.g., ['A', 'A'] -> { A: 2 })
    const itemMap = productIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const uniqueIds = Object.keys(itemMap);

    // 2. Start a Transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {

        // 3. Fetch products and check availability
        const products = await tx.product.findMany({
            where: { id: { in: uniqueIds } },
        });

        if (products.length !== uniqueIds.length) {
            throw new ApiError("One or more products no longer exist.", 404);
        }

        // Check if any product is already sold or hidden
        const unavailable = products.filter(p => !p.isAvailable);
        if (unavailable.length > 0) {
            const names = unavailable.map(p => p.title).join(", ");
            throw new ApiError(`The following items are no longer available: ${names}`, 400);
        }

        // 4. Calculate total
        const totalAmount = products.reduce((sum, p) => {
            return sum + (p.price * itemMap[p.id]);
        }, 0);

        // 5. Create the Order
        const order = await tx.order.create({
            data: {
                totalAmount,
                buyerId: userId,
                items: {
                    create: products.map((p) => ({
                        productId: p.id,
                        priceAtPurchase: p.price,
                        quantity: itemMap[p.id],
                    })),
                },
            },
            include: { items: true }
        });

        // 6. Mark products as unavailable (Since they are now sold)
        // In many "Smurf" or account shops, quantity is usually 1 and then it's gone.
        await tx.product.updateMany({
            where: { id: { in: uniqueIds } },
            data: { transactionBlock: true }
        });

        return order;
    });
};
