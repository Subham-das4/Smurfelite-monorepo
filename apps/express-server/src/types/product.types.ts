import { InputJsonValue } from "@prisma/client/runtime/client";
import { Product } from "@smurfelite/types/src/generated/prisma/index.js";

export type ProductCreateInput = Omit<
  Product,
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
  specifications: InputJsonValue;
};
