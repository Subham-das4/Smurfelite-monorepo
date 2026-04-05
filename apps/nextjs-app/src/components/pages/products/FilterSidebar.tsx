'use client';

import React, { useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MdFilterList, MdSearch } from 'react-icons/md';
import { GAME_OPTIONS, SORT_OPTIONS } from './data';

export const FilterSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /** Build a new URL with the given param changes applied */
  const buildUrl = useCallback(
    (changes: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Any filter change resets to page 1
      params.delete('page');
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  const navigate = useCallback(
    (changes: Record<string, string | undefined>) => {
      startTransition(() => {
        router.push(buildUrl(changes));
      });
    },
    [router, buildUrl],
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Current values from URL
  const search = searchParams.get('search') ?? '';
  const gameTypeParam = searchParams.get('gameType') ?? '';
  const priceMin = searchParams.get('minPrice') ?? '';
  const priceMax = searchParams.get('maxPrice') ?? '';
  const sortValue = `${searchParams.get('sortBy') ?? 'createdAt'}|${searchParams.get('sortOrder') ?? 'desc'}`;

  const selectedGames = gameTypeParam
    ? gameTypeParam.split(',').map((g) => g.trim()).filter(Boolean)
    : [];

  const toggleGame = (game: string) => {
    const next = selectedGames.includes(game)
      ? selectedGames.filter((g) => g !== game)
      : [...selectedGames, game];
    navigate({ gameType: next.join(',') || undefined });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('|');
    navigate({ sortBy, sortOrder });
  };

  return (
    <aside className="w-full lg:w-1/4 shrink-0">
      <div
        className={`bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 sticky top-24 transition-opacity ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MdFilterList className="text-primary text-xl" />
            Filters
          </h2>
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-primary underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={sortValue}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              defaultValue={search}
              key={search}
              onBlur={(e) => {
                if (e.target.value !== search) navigate({ search: e.target.value || undefined });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate({ search: (e.target as HTMLInputElement).value || undefined });
                }
              }}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400 transition-colors"
            />
            <MdSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
          </div>
        </div>

        {/* Game Title — multi-select checkboxes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Game Title
          </label>
          <div className="space-y-2">
            {GAME_OPTIONS.map((game) => (
              <label key={game} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedGames.includes(game)}
                  onChange={() => toggleGame(game)}
                  className="w-4 h-4 accent-primary rounded border-gray-300 cursor-pointer"
                />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors text-sm">
                  {game}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Price Range
          </label>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-1/2">
              <span className="absolute left-3 top-2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                min={0}
                defaultValue={priceMin}
                key={`min-${priceMin}`}
                onBlur={(e) => {
                  if (e.target.value !== priceMin) navigate({ minPrice: e.target.value || undefined });
                }}
                placeholder="Min"
                className="w-full pl-6 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
            <span className="text-gray-400 text-sm">–</span>
            <div className="relative w-1/2">
              <span className="absolute left-3 top-2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                min={0}
                defaultValue={priceMax}
                key={`max-${priceMax}`}
                onBlur={(e) => {
                  if (e.target.value !== priceMax) navigate({ maxPrice: e.target.value || undefined });
                }}
                placeholder="Max"
                className="w-full pl-6 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
