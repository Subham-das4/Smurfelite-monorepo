import type { WalletLedgerListResponse, WalletResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyWallet: builder.query<WalletResponse, void>({
      query: () => "/wallets/me",
      providesTags: ["Wallet"],
    }),
    getMyLedger: builder.query<
      WalletLedgerListResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/wallets/me/ledger", params }),
      providesTags: ["Ledger"],
    }),
  }),
});

export const { useGetMyWalletQuery, useGetMyLedgerQuery } = walletApi;
