'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProductListItem, ProductMeta } from '@smurfelite/types';
import { ProductCard } from './ProductCard';
import { Pagination } from './Pagination';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setIsLoginModalOpen } from '@/store/reducers/auth/slice';
import { useAddToCartMutation } from '@/api/cart';
import { toast } from 'react-toastify';

interface ProductsGridProps {
  products: ProductListItem[];
  meta: ProductMeta;
  currentPage: number;
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ products, meta, currentPage }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [addToCart] = useAddToCartMutation();
  const [, startTransition] = useTransition();

  const handleBuy = async (productId: string) => {
    if (!isAuthenticated) {
      dispatch(setIsLoginModalOpen(true));
      return;
    }
    const result = await addToCart(productId);
    if ('error' in result) {
      toast.error('Failed to add to cart. Please try again.');
    } else {
      toast.success('Added to cart!', { autoClose: 2000 });
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
          No accounts match your filters.
        </p>
        <button
          onClick={() => startTransition(() => router.push(pathname))}
          className="mt-4 text-primary hover:text-primary-hover underline text-sm cursor-pointer"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {meta.totalCount} account{meta.totalCount !== 1 ? 's' : ''} found
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onBuy={handleBuy} />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
