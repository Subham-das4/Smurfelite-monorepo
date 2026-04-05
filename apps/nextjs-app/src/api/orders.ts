import {
    CreateOrderRequest,
    OrderResponse,
    OrderCredentialsResponse,
} from '@smurfelite/types';
import { baseApi } from './baseApi';

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Create a new order from a list of product IDs
        createOrder: build.mutation<OrderResponse, CreateOrderRequest>({
            query: (body) => ({
                url: '/orders',
                method: 'POST',
                body,
            }),
            // Invalidate the orders list and the cart (cart is emptied after checkout)
            invalidatesTags: [
                { type: 'Orders', id: 'LIST' },
                'Cart',
            ],
        }),

        /////////////////////
        // Get all orders for the authenticated buyer
        getMyOrders: build.query<OrderResponse[], void>({
            query: () => '/orders',
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({
                              type: 'Order' as const,
                              id,
                          })),
                          { type: 'Orders' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Orders' as const, id: 'LIST' }],
        }),

        /////////////////////
        // Get a single order by ID (buyer who owns it)
        getOrderById: build.query<OrderResponse, string>({
            query: (orderId) => `/orders/${orderId}`,
            providesTags: (_result, _err, orderId) => [
                { type: 'Order', id: orderId },
            ],
        }),

        /////////////////////
        // Cancel a PENDING order
        cancelOrder: build.mutation<OrderResponse, string>({
            query: (orderId) => ({
                url: `/orders/${orderId}/cancel`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _err, orderId) => [
                { type: 'Orders', id: 'LIST' },
                { type: 'Order', id: orderId },
            ],
        }),

        /////////////////////
        // Retrieve decrypted account credentials (COMPLETED orders only)
        getOrderCredentials: build.query<OrderCredentialsResponse, string>({
            query: (orderId) => `/orders/${orderId}/credentials`,
        }),
    }),
});

export const {
    useCreateOrderMutation,
    useGetMyOrdersQuery,
    useGetOrderByIdQuery,
    useCancelOrderMutation,
    useGetOrderCredentialsQuery,
} = ordersApi;
