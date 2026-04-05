'use client';

import React, { useCallback } from 'react';
import { MdFilterList, MdSearch } from 'react-icons/md';
import { GAME_OPTIONS, PLATFORM_OPTIONS, RANK_TIER_OPTIONS } from './data';
import { DEFAULT_FILTERS, FilterState } from './types';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onChange }) => {
  const update = useCallback(
    (partial: Partial<FilterState>) => onChange({ ...filters, ...partial }),
    [filters, onChange],
  );

  const toggleGame = (game: string) => {
    const next = filters.selectedGames.includes(game)
      ? filters.selectedGames.filter((g) => g !== game)
      : [...filters.selectedGames, game];
    update({ selectedGames: next });
  };

  return (
    <aside className="w-full lg:w-1/4 flex-shrink-0">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 sticky top-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MdFilterList className="text-primary text-xl" />
            Filters
          </h3>
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-gray-500 hover:text-primary underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-gray-400 transition-colors"
            />
            <MdSearch className="absolute left-3 top-2.5 text-gray-400 text-lg" />
          </div>
        </div>

        {/* Game Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Game Title
          </label>
          <div className="space-y-2">
            {GAME_OPTIONS.map((game) => (
              <label key={game} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.selectedGames.includes(game)}
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Price Range
          </label>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-1/2">
              <span className="absolute left-3 top-2 text-gray-500 text-xs">$</span>
              <input
                type="number"
                min={0}
                value={filters.priceMin}
                onChange={(e) => update({ priceMin: e.target.value })}
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
                value={filters.priceMax}
                onChange={(e) => update({ priceMax: e.target.value })}
                placeholder="Max"
                className="w-full pl-6 pr-2 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={filters.priceMax || 1000}
            onChange={(e) => update({ priceMax: e.target.value })}
            className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-primary bg-gray-200 dark:bg-gray-700"
          />
        </div>

        {/* Platform */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Platform
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((platform) => (
              <button
                key={platform}
                onClick={() => update({ selectedPlatform: platform })}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                  filters.selectedPlatform === platform
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-100 dark:bg-background-dark text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Rank Tier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Rank Tier
          </label>
          <div className="space-y-2">
            {RANK_TIER_OPTIONS.map((tier) => (
              <label key={tier.value} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rankTier"
                  value={tier.value}
                  checked={filters.rankTier === tier.value}
                  onChange={() => update({ rankTier: tier.value })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors text-sm">
                  {tier.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
