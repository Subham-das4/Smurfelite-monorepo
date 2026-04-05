export type OrderStatus = "completed" | "processing" | "cancelled";

export type OrderStatusFilter = "all" | OrderStatus;

export type OrderSortOption =
  | "newest"
  | "oldest"
  | "price-high"
  | "price-low";

export interface GameAccount {
  name: string;
  image: string;
}

export interface Order {
  id: string;
  gameAccount: GameAccount;
  datePlaced: string; // ISO date string
  total: number;
  status: OrderStatus;
}

export interface OrdersPageData {
  orders: Order[];
  total: number;
}
