import type { OrderStatus } from "@smurfelite/types";

export type { OrderStatus };

export type OrderStatusFilter = "all" | OrderStatus;

export type OrderSortOption = "newest" | "oldest" | "price-high" | "price-low";
