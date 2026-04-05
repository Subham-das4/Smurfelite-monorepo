import {
    ProductFilters,
    ProductListResponse,
    ProductListItem,
    CreateProductRequest,
    UpdateProductRequest,
} from '@smurfelite/types';
import { baseApi } from './baseApi';

export const productsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        /////////////////////
        // Get paginated + filtered product catalogue (public)
        getAllProducts: build.query<ProductListResponse, ProductFilters | void>({
            query: (filters) => {
                const params = new URLSearchParams();
                if (!filters) return '/products';
                if (filters.page !== undefined) params.set('page', String(filters.page));
                if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
                if (filters.gameType) params.set('gameType', filters.gameType);
                if (filters.minPrice) params.set('minPrice', filters.minPrice);
                if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
                if (filters.search) params.set('search', filters.search);
                if (filters.sortBy) params.set('sortBy', filters.sortBy);
                if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
                const qs = params.toString();
                return `/products${qs ? `?${qs}` : ''}`;
            },
            providesTags: (result) =>
                result
                    ? [
                          ...result.products.map(({ id }) => ({
                              type: 'Product' as const,
                              id,
                          })),
                          { type: 'Products' as const, id: 'LIST' },
                      ]
                    : [{ type: 'Products' as const, id: 'LIST' }],
        }),

        /////////////////////
        // Get single product detail (public — no credentials)
        getProductById: build.query<ProductListItem, string>({
            query: (productId) => `/products/${productId}`,
            providesTags: (_result, _err, productId) => [
                { type: 'Product', id: productId },
            ],
        }),

        /////////////////////
        // Create a product listing (SELLER / ADMIN)
        createProduct: build.mutation<ProductListItem, CreateProductRequest>({
            query: (body) => ({
                url: '/products',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Products', id: 'LIST' }],
        }),

        /////////////////////
        // Update a product listing (owning SELLER / ADMIN)
        updateProduct: build.mutation<
            ProductListItem,
            { id: string; body: UpdateProductRequest }
        >({
            query: ({ id, body }) => ({
                url: `/products/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _err, { id }) => [
                { type: 'Products', id: 'LIST' },
                { type: 'Product', id },
            ],
        }),

        /////////////////////
        // Delete a product listing (owning SELLER / ADMIN)
        deleteProduct: build.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _err, id) => [
                { type: 'Products', id: 'LIST' },
                { type: 'Product', id },
            ],
        }),
    }),
});

export const {
    useGetAllProductsQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productsApi;
