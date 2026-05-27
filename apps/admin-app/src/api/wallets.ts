import type {
  AdminWalletDetailResponse,
  AdminWalletListResponse,
  RecordPayoutRequest,
  WalletLedgerListResponse,
  WalletResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const walletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWallets: builder.query<
      AdminWalletListResponse,
      { page?: number; pageSize?: number; search?: string }
    >({
      query: (params) => ({ url: "/wallets", params }),
      providesTags: ["Wallets"],
    }),
    getWallet: builder.query<AdminWalletDetailResponse, string>({
      query: (sellerId) => `/wallets/${sellerId}`,
      providesTags: (_r, _e, id) => [{ type: "Wallets", id }],
    }),
    getWalletLedger: builder.query<
      WalletLedgerListResponse,
      { sellerId: string; page?: number; pageSize?: number }
    >({
      query: ({ sellerId, page, pageSize }) => ({
        url: `/wallets/${sellerId}/ledger`,
        params: { page, pageSize },
      }),
      providesTags: ["Ledger"],
    }),
    recordPayout: builder.mutation<
      WalletResponse,
      { sellerId: string; body: RecordPayoutRequest }
    >({
      query: ({ sellerId, body }) => ({
        url: `/wallets/${sellerId}/payout`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wallets", "Ledger"],
    }),
  }),
});

export const {
  useGetWalletsQuery,
  useGetWalletQuery,
  useGetWalletLedgerQuery,
  useRecordPayoutMutation,
} = walletsApi;
