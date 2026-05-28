import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { LoginResponse } from "@smurfelite/types";
import { setCredentials } from "@/store/authSlice";
import { logout } from "@/store/userSlice";
import type { RootState } from "@/store/store";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_EXPRESS_SERVER_API ?? "",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

const NO_REAUTH = new Set([
  "/auth/admin/login",
  "/auth/admin/forgot-password",
  "/auth/admin/reset-password",
  "/auth/refresh",
  "/auth/logout",
]);

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : (args.url ?? "");
  if (result.error?.status === 401 && !NO_REAUTH.has(url)) {
    const refresh = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );
    const data = refresh.data as LoginResponse | undefined;
    if (data?.accessToken) {
      api.dispatch(
        setCredentials({
          token: data.accessToken,
          refreshToken: data.refreshToken ?? "",
        })
      );
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Users",
    "User",
    "Products",
    "Product",
    "Orders",
    "Order",
    "Enquiries",
    "Disputes",
    "Games",
    "Platforms",
    "Wallets",
    "Ledger",
    "Admins",
  ],
  endpoints: () => ({}),
});
