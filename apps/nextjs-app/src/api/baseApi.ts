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
import { RefreshTokenResponse } from '@smurfelite/types';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_EXPRESS_SERVER_API ?? '',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) headers.set('authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');
        return headers;
    },
});

const NO_REAUTH_ROUTES = new Set([
    '/auth/buyer/login',
    '/auth/buyer/google',
    '/auth/buyer/forgot-password',
    '/auth/buyer/reset-password',
    '/auth/register',
    '/auth/logout',
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
        const refreshResult = await baseQuery(
            {
                url: '/auth/refresh',
                method: 'POST',
                body: { actingAs: 'BUYER' },
            },
            api,
            extraOptions
        );

        const refreshData = refreshResult.data as RefreshTokenResponse | undefined;

        if (refreshData?.accessToken) {
            api.dispatch(
                setCredentials({
                    token: refreshData.accessToken,
                    refreshToken: '',
                    actingAs: refreshData.actingAs ?? 'BUYER',
                })
            );
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
