import type { SellerSalesResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellerSales: builder.query<
      SellerSalesResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/orders/seller", params }),
      providesTags: ["Sales"],
    }),
  }),
});

export const { useGetSellerSalesQuery } = salesApi;
