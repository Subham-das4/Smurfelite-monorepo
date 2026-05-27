import { OrderItemResponse } from "@smurfelite/types";

export type OrderStatus = "completed" | "processing" | "cancelled";

export type OrderStatusFilter = "all" | OrderStatus;

export type OrderSortOption = "newest" | "oldest" | "price-high" | "price-low";

export interface GameAccount {
  name: string;
  image: string;
}

export interface OrdersPageData {
  orders: OrderItemResponse[];
  total: number;
}
