import type { CredentialResponse } from "@react-oauth/google";
import type { LoginRequest, LoginResponse } from "@smurfelite/types";
import { setCredentials } from "@/store/authSlice";
import { setUser, logout } from "@/store/userSlice";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        const { data } = await queryFulfilled;
        dispatch(
          setCredentials({
            token: data.accessToken,
            refreshToken: data.refreshToken,
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
            refreshToken: data.refreshToken,
          })
        );
        dispatch(setUser(data.user));
      },
    }),
    logout: builder.mutation<null, void>({
      queryFn: async (_, { getState }, _extra, baseQuery) => {
        const refreshToken = (getState() as { auth: { refreshToken: string | null } })
          .auth.refreshToken;
        await baseQuery({
          url: "/auth/logout",
          method: "POST",
          body: { refresh_token: refreshToken },
        });
        return { data: null };
      },
      async onQueryStarted(_, { dispatch }) {
        dispatch(logout());
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleAuthMutation,
  useLogoutMutation,
} = authApi;
