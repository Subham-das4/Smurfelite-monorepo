export type BadgeVariant = 'prime' | 'hot-deal';

export interface ProductBadge {
  label: string;
  variant: BadgeVariant;
}

export interface PlatformInfo {
  name: string;
  iconUrl: string;
  bgColor: string;
}

export interface ProductListing {
  id: string;
  gameType: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  imageUrl: string;
  imageAlt: string;
  badge?: ProductBadge;
  platform: PlatformInfo;
  features: string[];
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface FilterState {
  search: string;
  selectedGames: string[];
  priceMin: string;
  priceMax: string;
  selectedPlatform: string;
  rankTier: string;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  selectedGames: [],
  priceMin: '',
  priceMax: '',
  selectedPlatform: 'All',
  rankTier: 'any',
  sortBy: 'featured',
};
