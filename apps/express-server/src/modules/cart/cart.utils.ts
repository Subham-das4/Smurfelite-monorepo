import { CreateCartDTO, GetCartQueryReturn } from "../../types/cart.types.js";

export const createCartDTO = (cart: GetCartQueryReturn): CreateCartDTO => {
    return {
        items: cart.items.map(item => item.product),
        totalItems: cart._count.items,
        totalPrice: cart.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    };
}