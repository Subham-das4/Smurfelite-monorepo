import {
    createApi,
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { logout } from '@/store/reducers/user/slice';
import { setCredentials } from '@/store/reducers/auth/slice';
import type { RootState } from '@/store/store';
import { LoginResponse } from '@smurfelite/types';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_EXPRESS_SERVER_API ?? '',
    // Include HTTP-only cookies on every request (required for refresh token flow)
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) headers.set('authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');
        return headers;
    },
});

/**
 * Routes that should never trigger a token refresh on 401.
 * A 401 from these endpoints means invalid credentials or an expired
 * token link — not an expired session — so dispatching logout would be wrong.
 */
const NO_REAUTH_ROUTES = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/google',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/auth/verify-email',
]);

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url ?? '';
    const isNoReauthRoute = NO_REAUTH_ROUTES.has(requestUrl);

    if (result.error && result.error.status === 401 && !isNoReauthRoute) {
        // Attempt to refresh — backend reads the refresh token from the HTTP-only cookie
        const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
        );

        const refreshData = refreshResult.data as LoginResponse | undefined;

        if (refreshData?.accessToken) {
            api.dispatch(
                setCredentials({
                    token: refreshData.accessToken,
                    refreshToken: refreshData.refreshToken ?? '',
                })
            );
            // Retry the original request with the new access token
            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch(logout());
        }
    }

    return result;
};

const tagTypes = [
    'User',
    'UserProfile',
    'Products',
    'Product',
    'Cart',
    'Orders',
    'Order',
    'Enquiries',
    'Disputes',
] as const;

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes,
    endpoints: () => ({}),
});
