'use client';

import React, { useMemo, useState } from 'react';
import { DUMMY_PRODUCTS, SORT_OPTIONS } from './data';
import { FilterSidebar } from './FilterSidebar';
import { Pagination } from './Pagination';
import { ProductCard } from './ProductCard';
import { DEFAULT_FILTERS, FilterState, SortOption } from './types';

const PRODUCTS_PER_PAGE = 6;

function applyFilters(filters: FilterState) {
  let result = [...DUMMY_PRODUCTS];

  if (filters.search.trim()) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.gameType.toLowerCase().includes(query) ||
        p.features.some((f) => f.toLowerCase().includes(query)),
    );
  }

  if (filters.selectedGames.length > 0) {
    result = result.filter((p) => {
      const productGame = p.gameType.toLowerCase();
      return filters.selectedGames.some((g) => {
        const filterGame = g.toLowerCase();
        // Match either direction — handles "CS:GO / CS2" matching "CS:GO 2"
        return (
          productGame.includes(filterGame) ||
          filterGame.includes(productGame) ||
          filterGame.split(/[\s/]+/).some((token) => token.length > 2 && productGame.includes(token))
        );
      });
    });
  }

  if (filters.priceMin !== '') {
    result = result.filter((p) => p.price >= Number(filters.priceMin));
  }

  if (filters.priceMax !== '') {
    result = result.filter((p) => p.price <= Number(filters.priceMax));
  }

  if (filters.selectedPlatform !== 'All') {
    result = result.filter((p) => p.platform.name === filters.selectedPlatform);
  }

  const SORT_FNS: Record<SortOption, (a: (typeof result)[0], b: (typeof result)[0]) => number> = {
    featured: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    newest: (a, b) => b.id.localeCompare(a.id),
  };

  result.sort(SORT_FNS[filters.sortBy]);

  return result;
}

const ProductsPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => applyFilters(filters), [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  const handleFilterChange = (updated: FilterState) => {
    setFilters(updated);
    setCurrentPage(1);
  };

  const handleBuy = (productId: string) => {
    // TODO: dispatch add-to-cart action
    console.log('Buy clicked:', productId);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
        <div>
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

        <div className="mt-6 md:mt-0 w-full md:w-auto">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value as SortOption })}
            className="form-select w-full md:w-64 bg-surface-light dark:bg-surface-dark border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-primary focus:border-primary text-sm cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar filters={filters} onChange={handleFilterChange} />

        <div className="flex-1">
          {pagedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pagedProducts.map((product) => (
                <ProductCard key={product.id} product={product} onBuy={handleBuy} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                No accounts match your filters.
              </p>
              <button
                onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                className="mt-4 text-primary hover:text-primary-hover underline text-sm cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProductsPage;
