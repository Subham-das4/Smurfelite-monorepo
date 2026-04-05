export type SortOption = 'price-asc' | 'price-desc' | 'newest';

export interface FilterState {
  search: string;
  /** Comma-separated game types, e.g. "Valorant,CS:GO 2" */
  gameType: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  gameType: '',
  priceMin: '',
  priceMax: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
