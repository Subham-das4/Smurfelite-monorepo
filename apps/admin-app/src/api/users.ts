import type { ProductListResponse, User } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export type UserListItem = {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  sellerDelisted: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UserListResponse = {
  users: UserListItem[];
  meta: { totalCount: number; totalPages: number; currentPage: number; pageSize: number };
};

export type UserDetailResponse = Omit<User, "password"> & {
  cart?: { items: unknown[] };
  orders?: unknown[];
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      UserListResponse,
      { page?: number; pageSize?: number; search?: string }
    >({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["Users"],
    }),
    getUser: builder.query<UserDetailResponse, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    getUserProducts: builder.query<ProductListResponse, { userId: string; page?: number }>({
      query: ({ userId, page }) => ({
        url: `/users/${userId}/products`,
        params: { page, pageSize: 20 },
      }),
    }),
    updateRole: builder.mutation<User, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Users", "User"],
    }),
    promoteSeller: builder.mutation<User, string>({
      query: (userId) => ({
        url: `/users/${userId}/promote-seller`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users", "User", "Wallets"],
    }),
    delistSeller: builder.mutation<User, string>({
      query: (userId) => ({
        url: `/users/${userId}/delist`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users", "User", "Products"],
    }),
    reactivateSeller: builder.mutation<User, string>({
      query: (userId) => ({
        url: `/users/${userId}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users", "User", "Products"],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({ url: `/users/${userId}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserProductsQuery,
  useUpdateRoleMutation,
  usePromoteSellerMutation,
  useDelistSellerMutation,
  useReactivateSellerMutation,
  useDeleteUserMutation,
} = usersApi;
