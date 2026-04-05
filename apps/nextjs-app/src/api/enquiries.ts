import { EnquiryPayload, EnquiryResponse } from '@smurfelite/types';
import { baseApi } from './baseApi';

export const enquiriesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Submit a new enquiry
        sendEnquiry: build.mutation<EnquiryResponse, EnquiryPayload>({
            query: (body) => ({
                url: '/enquiries',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Enquiries'],
        }),

        /////////////////////
        // Get the current user's own enquiries
        getMyEnquiries: build.query<EnquiryResponse[], void>({
            query: () => '/enquiries/mine',
            providesTags: ['Enquiries'],
        }),
    }),
});

export const {
    useSendEnquiryMutation,
    useGetMyEnquiriesQuery,
} = enquiriesApi;
