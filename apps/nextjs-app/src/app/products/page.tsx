import type { Metadata } from 'next';
import type { ProductListResponse } from '@smurfelite/types';
import { FilterSidebar } from '@/components/pages/products/FilterSidebar';
import { ProductsGrid } from '@/components/pages/products/ProductsGrid';

const PRODUCTS_PER_PAGE = 6;

interface SearchParams {
  search?: string;
  gameType?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function fetchProducts(params: SearchParams): Promise<ProductListResponse> {
  const apiBase =
    process.env.EXPRESS_SERVER_API ?? process.env.NEXT_PUBLIC_EXPRESS_SERVER_API;

  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.gameType) qs.set('gameType', params.gameType);
  if (params.minPrice) qs.set('minPrice', params.minPrice);
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice);
  qs.set('sortBy', params.sortBy ?? 'createdAt');
  qs.set('sortOrder', params.sortOrder ?? 'desc');
  qs.set('page', params.page ?? '1');
  qs.set('pageSize', String(PRODUCTS_PER_PAGE));

  try {
    const res = await fetch(`${apiBase}/products?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return (await res.json()) as ProductListResponse;
  } catch {
    return { products: [], meta: { totalCount: 0, totalPages: 1, currentPage: 1, pageSize: PRODUCTS_PER_PAGE } };
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const gameType = params.gameType;
  const search = params.search;

  const titleParts = ['Browse Game Accounts'];
  if (gameType) titleParts.unshift(gameType);
  if (search) titleParts.push(`"${search}"`);

  return {
    title: `${titleParts.join(' — ')} | SmurfElite`,
    description:
      'Find premium ranked game accounts for CS2, Valorant, GTA V, League of Legends, Fortnite and more. Instant delivery, full access, lifetime warranty.',
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? '1');

  const data = await fetchProducts(params);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">
            Premium Accounts
          </span>
          <div className="h-0.5 w-8 bg-primary rounded-full" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Browse Game Accounts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Find the perfect ranked account for your favorite games. Instant delivery, full access,
          and lifetime warranty.
        </p>
      </div>

      {/* Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* FilterSidebar is a client component that reads/writes URL params */}
        <FilterSidebar />

        {/* ProductsGrid is a client component that handles cart/auth interactions */}
        <ProductsGrid
          products={data.products}
          meta={data.meta}
          currentPage={currentPage}
        />
      </div>
    </main>
  );
}
