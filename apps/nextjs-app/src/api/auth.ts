import { logout, RootState, setCredentials, setUser } from '@/store';
import { baseApi } from './baseApi';
import { userApi } from './user';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@smurfelite/types';

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
                    const { data: { data } } = await queryFulfilled;
                    dispatch(setCredentials({
                        token: data.access_token,
                        refreshToken: data.refresh_token,
                    }));
                    dispatch(setUser(data as unknown as User));
                    dispatch(
                        userApi.endpoints.getUser.initiate(undefined, {
                            subscribe: false,
                            forceRefetch: true,
                        })
                    );
                } catch (error) {
                    console.error(error);
                }
            },
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
    }),
});

export const { useLoginMutation, useLogoutMutation, useRegisterMutation } = authApi;

