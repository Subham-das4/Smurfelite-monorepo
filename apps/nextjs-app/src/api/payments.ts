import {
    CreatePayPalOrderRequest,
    CreatePayPalOrderResponse,
    CapturePayPalOrderRequest,
    CapturePayPalOrderResponse,
    CreateNowPaymentsInvoiceRequest,
    CreateNowPaymentsInvoiceResponse,
    PaymentBypassStatusResponse,
    CompleteBypassPaymentRequest,
    CompleteBypassPaymentResponse,
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

        createNowPaymentsInvoice: build.mutation<
            CreateNowPaymentsInvoiceResponse,
            CreateNowPaymentsInvoiceRequest
        >({
            query: (body) => ({
                url: '/payments/nowpayments/create-invoice',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _err, { internalOrderId }) => [
                { type: 'Order', id: internalOrderId },
            ],
        }),

        getPaymentBypassStatus: build.query<PaymentBypassStatusResponse, void>({
            query: () => '/payments/bypass/status',
        }),

        completeBypassPayment: build.mutation<
            CompleteBypassPaymentResponse,
            CompleteBypassPaymentRequest
        >({
            query: (body) => ({
                url: '/payments/bypass/complete',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _err, { internalOrderId }) => [
                { type: 'Order', id: internalOrderId },
                { type: 'Orders', id: 'LIST' },
                'Cart',
            ],
        }),
    }),
});

export const {
    useCreatePayPalOrderMutation,
    useCapturePayPalOrderMutation,
    useCreateNowPaymentsInvoiceMutation,
    useGetPaymentBypassStatusQuery,
    useCompleteBypassPaymentMutation,
} = paymentsApi;
