import {
    CreatePayPalOrderRequest,
    CreatePayPalOrderResponse,
    CapturePayPalOrderRequest,
    CapturePayPalOrderResponse,
} from '@smurfelite/types';
import { baseApi } from './baseApi';

export const paymentsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Create a PayPal order for an internal order — returns paypalOrderId to pass to PayPal JS SDK
        createPayPalOrder: build.mutation<
            CreatePayPalOrderResponse,
            CreatePayPalOrderRequest
        >({
            query: (body) => ({
                url: '/payments/paypal/create-order',
                method: 'POST',
                body,
            }),
        }),

        /////////////////////
        // Capture the PayPal payment after buyer approval — marks internal order as PROCESSING
        capturePayPalOrder: build.mutation<
            CapturePayPalOrderResponse,
            CapturePayPalOrderRequest
        >({
            query: (body) => ({
                url: '/payments/paypal/capture-order',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _err, { internalOrderId }) => [
                { type: 'Order', id: internalOrderId },
                { type: 'Orders', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useCreatePayPalOrderMutation,
    useCapturePayPalOrderMutation,
} = paymentsApi;
