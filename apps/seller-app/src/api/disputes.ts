import type { DisputeResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const disputesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyDisputes: builder.query<DisputeResponse[], void>({
      query: () => "/disputes/mine",
      providesTags: ["Disputes"],
    }),
  }),
});

export const { useGetMyDisputesQuery } = disputesApi;
