import type { SellerApprovalStatus } from "@smurfelite/types";

export function isSellerApproved(status?: SellerApprovalStatus) {
  return status === "APPROVED";
}
