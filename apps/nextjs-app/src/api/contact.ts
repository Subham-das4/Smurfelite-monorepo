import { EnquiryPayload } from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const contactApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Send Enquiry API Endpoint
        sendEnquiry: build.mutation<void, EnquiryPayload>({
            query: (payload) => ({
                url: '/enquiry',
                method: 'POST',
                body: payload,
            }),
        }),
    }),
});

export const { useSendEnquiryMutation } = contactApi;