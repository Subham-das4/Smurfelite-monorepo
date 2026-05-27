import * as PrismaNamespace from "./prisma.js";

export type ProductCreateInput = Omit<
  PrismaNamespace.Product,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "accountUsername"
  | "accountPassword"
  | "accountEmail"
  | "accountEmailPassword"
  | "seller"
  | "items"
  | "cartIt" // Omit relations as well
  | "specifications"
> & {
  accountUsername: string;
  accountPassword: string;
  accountEmail: string;
  accountEmailPassword: string;
  specifications: PrismaNamespace.Prisma.InputJsonValue;
};

export type ProductUpdateData = Partial<ProductCreateInput>;

export interface ProductFilters {
  gameType?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  status?: string;
  sellerId?: string;
  page: number;
  pageSize: number;
  sortBy?: keyof PrismaNamespace.Product;
  sortOrder?: "asc" | "desc";
}
