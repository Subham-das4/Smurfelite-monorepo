import type {
  AdminProductListItem,
  AdminProductListResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProducts: builder.query<
      AdminProductListResponse,
      { page?: number; pageSize?: number; status?: string; search?: string; sellerId?: string }
    >({
      query: (params) => ({ url: "/products/admin", params }),
      providesTags: ["Products"],
    }),
    getProduct: builder.query<AdminProductListItem, string>({
      query: (id) => `/products/admin/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    banProduct: builder.mutation<AdminProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/ban`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
    liftBanProduct: builder.mutation<AdminProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/lift-ban`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
  }),
});

export const {
  useGetAdminProductsQuery,
  useGetProductQuery,
  useBanProductMutation,
  useLiftBanProductMutation,
} = productsApi;
