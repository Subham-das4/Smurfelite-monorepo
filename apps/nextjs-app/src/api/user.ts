import { User } from '@smurfelite/types';
import { baseApi } from './baseApi';
import { setUser } from '@/store';

export const userApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getUser: build.query<User, void>({
            query: () => '/auth/me',
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setUser(data as unknown as User));
                } catch (error) {
                    console.error(error);
                }
            },
            providesTags: ['User'],
        }),
    }),
});

export const { useGetUserQuery } = userApi;
