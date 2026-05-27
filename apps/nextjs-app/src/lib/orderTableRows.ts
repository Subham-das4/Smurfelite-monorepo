import type { OrderResponse, OrderStatus as ApiOrderStatus } from "@smurfelite/types";
import type { OrderStatus } from "@/components/pages/orders/types";

export interface OrderTableRow {
  orderId: string;
  productId: string;
  priceAtPurchase: number;
  quantity: number;
  orderStatus: OrderStatus;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    gameType: string;
    price: number;
    imageUrl: string | null;
  };
}

export function mapApiOrderStatus(status: ApiOrderStatus): OrderStatus {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
    case "REFUNDED":
      return "cancelled";
    default:
      return "processing";
  }
}

export function flattenOrdersForTable(orders: OrderResponse[]): OrderTableRow[] {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      priceAtPurchase: item.priceAtPurchase,
      quantity: item.quantity,
      orderStatus: mapApiOrderStatus(order.status),
      createdAt: order.createdAt,
      product: item.product
        ? {
            id: item.product.id,
            title: item.product.title,
            gameType: item.product.gameType,
            price: item.product.price,
            imageUrl: item.product.imageUrl ?? null,
          }
        : undefined,
    }))
  );
}
