import type { DisputeResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const disputesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDisputes: builder.query<DisputeResponse[], { status?: string }>({
      query: (params) => ({ url: "/disputes", params }),
      providesTags: ["Disputes"],
    }),
    updateDisputeStatus: builder.mutation<
      DisputeResponse,
      { disputeId: string; status: string }
    >({
      query: ({ disputeId, status }) => ({
        url: `/disputes/${disputeId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Disputes"],
    }),
  }),
});

export const {
  useGetDisputesQuery,
  useUpdateDisputeStatusMutation,
} = disputesApi;
