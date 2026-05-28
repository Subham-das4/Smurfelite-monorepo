import { logout, setCredentials, setUser } from '@/store';
import type { RootState } from '@/store/store';
import { baseApi } from './baseApi';
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    User,
} from '@smurfelite/types';
import { CredentialResponse } from '@react-oauth/google';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (payload) => ({
                url: '/auth/buyer/login',
                method: 'POST',
                body: payload,
            }),
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({
                        token: data.accessToken,
                        refreshToken: data.refreshToken ?? '',
                        actingAs: data.actingAs ?? 'BUYER',
                    }));
                    dispatch(setUser(data.user as unknown as User));
                } catch (error) {
                    console.error(error);
                }
            },
            invalidatesTags: ['User'],
        }),

        logout: builder.mutation<null, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            onQueryStarted(_, { dispatch }) {
                dispatch(logout());
            },
        }),

        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (payload) => ({
                url: '/auth/register',
                method: 'POST',
                body: payload,
            }),
        }),

        googleOAuth: builder.mutation<LoginResponse, CredentialResponse>({
            query: (payload) => ({
                url: '/auth/buyer/google',
                method: 'POST',
                body: payload,
            }),
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({
                        token: data.accessToken,
                        refreshToken: data.refreshToken ?? '',
                        actingAs: data.actingAs ?? 'BUYER',
                    }));
                    dispatch(setUser(data.user as unknown as User));
                } catch (error) {
                    console.error(error);
                }
            },
        }),

        forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
            query: (payload) => ({
                url: '/auth/buyer/forgot-password',
                method: 'POST',
                body: payload,
            }),
        }),

        resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
            query: (payload) => ({
                url: '/auth/buyer/reset-password',
                method: 'POST',
                body: payload,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
    useGoogleOAuthMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = authApi;
