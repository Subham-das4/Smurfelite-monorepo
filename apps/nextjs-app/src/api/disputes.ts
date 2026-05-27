import { CreateDisputeRequest, DisputeResponse } from '@smurfelite/types';
import { baseApi } from './baseApi';

export const disputesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        createDispute: build.mutation<DisputeResponse, CreateDisputeRequest>({
            query: (body) => ({
                url: '/disputes',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Disputes'],
        }),

        getMyDisputes: build.query<DisputeResponse[], void>({
            query: () => '/disputes/mine',
            providesTags: ['Disputes'],
        }),
    }),
});

export const {
    useCreateDisputeMutation,
    useGetMyDisputesQuery,
} = disputesApi;
