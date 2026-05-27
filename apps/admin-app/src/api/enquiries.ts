import type { EnquiryResponse } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const enquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnquiries: builder.query<EnquiryResponse[], void>({
      query: () => "/enquiries",
      providesTags: ["Enquiries"],
    }),
    closeEnquiry: builder.mutation<EnquiryResponse, string>({
      query: (id) => ({ url: `/enquiries/${id}/close`, method: "PATCH" }),
      invalidatesTags: ["Enquiries"],
    }),
    deleteEnquiry: builder.mutation<void, string>({
      query: (id) => ({ url: `/enquiries/${id}`, method: "DELETE" }),
      invalidatesTags: ["Enquiries"],
    }),
  }),
});

export const {
  useGetEnquiriesQuery,
  useCloseEnquiryMutation,
  useDeleteEnquiryMutation,
} = enquiriesApi;
