import { CartResponse } from '@smurfelite/types';
import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Get the authenticated buyer's cart
        getCart: build.query<CartResponse, void>({
            query: () => '/cart',
            providesTags: ['Cart'],
        }),

        /////////////////////
        // Add a product to the cart
        addToCart: build.mutation<CartResponse, string>({
            query: (productId) => ({
                url: `/cart/${productId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Cart'],
        }),

        /////////////////////
        // Remove a product from the cart
        removeFromCart: build.mutation<CartResponse, string>({
            query: (productId) => ({
                url: `/cart/${productId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),

        /////////////////////
        // Remove all items from the cart (after successful checkout)
        clearCart: build.mutation<CartResponse, void>({
            query: () => ({
                url: '/cart',
                method: 'DELETE',
            }),
            invalidatesTags: ['Cart'],
        }),
    }),
});

export const {
    useGetCartQuery,
    useAddToCartMutation,
    useRemoveFromCartMutation,
    useClearCartMutation,
} = cartApi;
