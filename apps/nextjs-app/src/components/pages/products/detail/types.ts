import type { BreadcrumbItem } from "@/components/shared";

export type { BreadcrumbItem };

export type ProductTagVariant = "primary" | "secondary";

export interface ProductTag {
  label: string;
  variant: ProductTagVariant;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface AccountStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  avatarGradient: string;
  rating: number;
  date: string;
  body: string;
}

export interface SimilarProduct {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  level: number;
  price: number;
}

export interface ProductDetail {
  id: string;
  title: string;
  tags: ProductTag[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  isVerifiedSeller: boolean;
  images: ProductImage[];
  stats: AccountStat[];
  description: string;
  highlights: string[];
  specifications: ProductSpecification[];
  similarProducts: SimilarProduct[];
  breadcrumb: BreadcrumbItem[];
  /** @deprecated Mock-only — removed until review API exists */
  rating?: number;
  /** @deprecated Mock-only — removed until review API exists */
  reviewCount?: number;
  /** @deprecated Mock-only — removed until review API exists */
  reviews?: ProductReview[];
  /** @deprecated Mock-only — removed until review API exists */
  overallRating?: number;
}
