import type {
  AdminListResponse,
  CreateAdminRequest,
  CreateAdminResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const adminsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<
      AdminListResponse,
      { page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: "/admins", params }),
      providesTags: ["Admins"],
    }),
    createAdmin: builder.mutation<CreateAdminResponse, CreateAdminRequest>({
      query: (body) => ({ url: "/admins", method: "POST", body }),
      invalidatesTags: ["Admins"],
    }),
    deleteAdmin: builder.mutation<{ message: string }, string>({
      query: (adminId) => ({ url: `/admins/${adminId}`, method: "DELETE" }),
      invalidatesTags: ["Admins"],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useDeleteAdminMutation,
} = adminsApi;
