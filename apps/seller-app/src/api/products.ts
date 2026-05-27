import type {
  CreateProductRequest,
  ProductListItem,
  ProductListResponse,
  UpdateProductRequest,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProducts: builder.query<
      ProductListResponse,
      { page?: number; pageSize?: number; status?: string; search?: string }
    >({
      query: (params) => ({
        url: "/products/mine",
        params,
      }),
      providesTags: ["Products"],
    }),
    getProduct: builder.query<ProductListItem, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation<
      ProductListItem,
      CreateProductRequest & { publish?: boolean }
    >({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<
      ProductListItem,
      { id: string; body: UpdateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Products", "Product"],
    }),
    publishProduct: builder.mutation<ProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/publish`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
    delistProduct: builder.mutation<ProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/delist`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
    reactivateProduct: builder.mutation<ProductListItem, string>({
      query: (id) => ({ url: `/products/${id}/reactivate`, method: "PATCH" }),
      invalidatesTags: ["Products", "Product"],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products"],
    }),
  }),
});

export const {
  useGetMyProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  usePublishProductMutation,
  useDelistProductMutation,
  useReactivateProductMutation,
  useDeleteProductMutation,
} = productsApi;
