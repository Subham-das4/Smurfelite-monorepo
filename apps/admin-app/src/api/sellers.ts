import type {
  CreateSellerRequest,
  CreateSellerResponse,
  RejectSellerRequest,
  SellerApprovalStatus,
  SellerListItem,
  SellerListResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

type SellerMutationResponse = { seller: SellerListItem };

export const sellersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellers: builder.query<
      SellerListResponse,
      { status: SellerApprovalStatus; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/sellers", params }),
      providesTags: ["Sellers"],
    }),
    createSeller: builder.mutation<CreateSellerResponse, CreateSellerRequest>({
      query: (body) => ({ url: "/sellers", method: "POST", body }),
      invalidatesTags: ["Sellers"],
    }),
    approveSeller: builder.mutation<SellerMutationResponse, string>({
      query: (sellerId) => ({
        url: `/sellers/${sellerId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Sellers"],
    }),
    rejectSeller: builder.mutation<
      SellerMutationResponse,
      { sellerId: string; note?: string }
    >({
      query: ({ sellerId, note }) => ({
        url: `/sellers/${sellerId}/reject`,
        method: "PATCH",
        body: { note } satisfies RejectSellerRequest,
      }),
      invalidatesTags: ["Sellers"],
    }),
  }),
});

export const {
  useGetSellersQuery,
  useCreateSellerMutation,
  useApproveSellerMutation,
  useRejectSellerMutation,
} = sellersApi;
