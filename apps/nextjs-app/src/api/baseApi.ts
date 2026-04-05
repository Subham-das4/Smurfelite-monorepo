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

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
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
] as const;

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes,
    endpoints: () => ({}),
});
