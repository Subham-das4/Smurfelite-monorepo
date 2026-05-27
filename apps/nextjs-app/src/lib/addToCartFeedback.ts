import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export type AddToCartMutationResult<T> =
  | { data: T }
  | { error: FetchBaseQueryError | SerializedError };

function isFetchBaseQueryError(
  e: FetchBaseQueryError | SerializedError,
): e is FetchBaseQueryError {
  return typeof e === "object" && e !== null && "status" in e;
}

function messageFromErrorData(data: unknown): string | undefined {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }
  return undefined;
}

/** Outcome after POST /cart/:productId — drives navigation and follow-up actions. */
export type AddToCartOutcome = "added" | "duplicate" | "error";

/**
 * Shows the appropriate toast for an add-to-cart mutation result.
 * @returns whether the item was newly added, was already in cart (409), or the request failed.
 */
export function notifyAddToCartResult<T>(
  result: AddToCartMutationResult<T>,
  options: {
    productTitle?: string;
    /** When true (e.g. Buy now → checkout), 409 does not show a toast — caller may navigate instead. */
    suppressDuplicateToast?: boolean;
  } = {},
): AddToCartOutcome {
  if ("data" in result && result.data !== undefined) {
    const msg = options.productTitle
      ? `"${options.productTitle}" added to cart!`
      : "Added to cart!";
    toast.success(msg, { autoClose: 2500 });
    return "added";
  }

  if (!("error" in result)) {
    toast.error("Failed to add to cart. Please try again.");
    return "error";
  }

  const err = result.error;
  if (isFetchBaseQueryError(err) && err.status === 409) {
    if (!options.suppressDuplicateToast) {
      toast.info(
        messageFromErrorData(err.data) ??
          "This product is already in your cart.",
        { autoClose: 2500 },
      );
    }
    return "duplicate";
  }

  toast.error("Failed to add to cart. Please try again.");
  return "error";
}
