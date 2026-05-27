import type { OrderCredentialsResponse, OrderResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export type OrdersListResponse = {
  orders: OrderResponse[];
  meta: { totalCount: number; totalPages: number; currentPage: number; pageSize: number };
};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<
      OrdersListResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/orders/all", params }),
      providesTags: ["Orders"],
    }),
    getOrder: builder.query<OrderResponse, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    updateOrderStatus: builder.mutation<
      OrderResponse,
      { orderId: string; status: string }
    >({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Orders", "Order"],
    }),
    getOrderCredentials: builder.query<OrderCredentialsResponse, string>({
      query: (orderId) => `/orders/${orderId}/credentials`,
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useLazyGetOrderCredentialsQuery,
} = ordersApi;
