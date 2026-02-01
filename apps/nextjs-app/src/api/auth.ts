import { logout, RootState, setCredentials, setUser } from '@/store';
import { baseApi } from './baseApi';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@smurfelite/types';
import { CredentialResponse } from '@react-oauth/google';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        /////////////////////
        // Login API Endpoint
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (payload) => ({
                url: '/auth/login',
                method: 'POST',
                body: payload,
            }),
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data: { user, accessToken, refreshToken } } = await queryFulfilled;
                    dispatch(setCredentials({
                        token: accessToken,
                        refreshToken: refreshToken,
                    }));
                    dispatch(setUser(user as unknown as User));
                } catch (error) {
                    console.error(error);
                }
            },
            invalidatesTags: ['User'],
        }),

        /////////////////////
        // Logout API Endpoint
        logout: builder.mutation<null, void>({
            queryFn: async (_, { getState }, _extraOptions, baseQuery) => {
                const state = getState() as RootState;
                const refresh_token = state.auth.refreshToken;

                await baseQuery({
                    url: '/auth/logout',
                    method: 'POST',
                    body: { refresh_token },
                });

                return { data: null };
            },
            onQueryStarted(_, mutationLifeCycleApi) {
                mutationLifeCycleApi.dispatch(logout());
            },
        }),

        /////////////////////
        // Register API Endpoint
        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (payload) => ({
                url: '/auth/register',
                method: 'POST',
                body: payload,
            }),
        }),

        /////////////////////
        // Google OAuth API Endpoint
        googleOAuth: builder.mutation<LoginResponse, CredentialResponse>({
            query: (payload) => ({
                url: '/auth/google',
                method: 'POST',
                body: payload,
            }),
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data: { user, accessToken, refreshToken } } = await queryFulfilled;
                    dispatch(setCredentials({
                        token: accessToken,
                        refreshToken: refreshToken,
                    }));
                    dispatch(setUser(user as unknown as User));
                } catch (error) {
                    console.error(error);
                }
            },
        }),
    }),
});

export const { useLoginMutation, useLogoutMutation, useRegisterMutation, useGoogleOAuthMutation } = authApi;

