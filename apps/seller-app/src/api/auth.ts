import type { CredentialResponse } from "@react-oauth/google";
import type {
  LoginRequest,
  LoginResponse,
  SellerApplyRequest,
  SellerApplyResponse,
} from "@smurfelite/types";
import { setCredentials } from "@/store/authSlice";
import { setUser, logout } from "@/store/userSlice";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/seller/login", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        const { data } = await queryFulfilled;
        dispatch(
          setCredentials({
            token: data.accessToken,
            refreshToken: data.refreshToken ?? "",
          })
        );
        dispatch(setUser(data.user));
      },
    }),
    googleAuth: builder.mutation<LoginResponse, CredentialResponse>({
      query: (body) => ({ url: "/auth/google", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        const { data } = await queryFulfilled;
        dispatch(
          setCredentials({
            token: data.accessToken,
            refreshToken: data.refreshToken ?? "",
          })
        );
        dispatch(setUser(data.user));
      },
    }),
    logout: builder.mutation<null, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { dispatch }) {
        dispatch(logout());
      },
    }),
    applyAsSeller: builder.mutation<SellerApplyResponse, SellerApplyRequest>({
      query: (body) => ({ url: "/auth/seller/apply", method: "POST", body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleAuthMutation,
  useLogoutMutation,
  useApplyAsSellerMutation,
} = authApi;
