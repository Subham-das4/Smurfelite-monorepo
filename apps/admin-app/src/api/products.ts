import type {
  AdminProductListResponse,
  ProductListItem,
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
    getProduct: builder.query<ProductListItem, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    banProduct: builder.mutation<ProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/ban`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
    liftBanProduct: builder.mutation<ProductListItem, string>({
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
