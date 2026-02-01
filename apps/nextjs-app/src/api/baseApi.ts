import {
    createApi,
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    QueryReturnValue,
    FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import { logout } from '@/store/reducers/user/slice';
import { setCredentials } from '@/store/reducers/auth/slice';
import { LoginResponse } from '@smurfelite/types';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_EXPRESS_SERVER_API ?? '',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as { auth: { token: string } }).auth.token;
        if (token) headers.set('authorization', `Bearer ${token}`);
        headers.set('Content-Type', 'application/json');
        headers.set('withCredentials', 'true');
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
        const state = (api.getState() as { auth: { refreshToken: string } });
        const refreshToken = state.auth.refreshToken;
        const refreshResult = (await baseQuery(
            {
                url: '/auth/refresh', method: 'POST', body: {
                    refresh_token: refreshToken,
                }
            },
            api,
            extraOptions
        )) as QueryReturnValue<LoginResponse, FetchBaseQueryError, FetchBaseQueryMeta>;

        if (refreshResult.data?.accessToken) {
            api.dispatch(setCredentials({
                token: refreshResult.data.accessToken,
                refreshToken: refreshResult.data.refreshToken,
            }));

            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch(logout());
        }
    }

    return result;
};

const tagTypes = ['Topics', 'User'] as const;

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: tagTypes,
    endpoints: () => ({}),
});
