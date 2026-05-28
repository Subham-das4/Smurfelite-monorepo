"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckoutStepper } from "./CheckoutStepper";
import { PaymentForm } from "./PaymentForm";
import { PayPalCheckoutButtons } from "./PayPalCheckoutButtons";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { CheckoutUnavailableAlert } from "./CheckoutUnavailableAlert";
import type { PaymentMethod } from "./types";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { productsApi } from "@/api/products";
import { useGetCartQuery } from "@/api/cart";
import { useCreateOrderMutation } from "@/api/orders";
import {
  useCompleteBypassPaymentMutation,
  useCreateNowPaymentsInvoiceMutation,
  useCreatePayPalOrderMutation,
  useGetPaymentBypassStatusQuery,
  useGetPayPalStatusQuery,
} from "@/api/payments";
import { setIsLoginModalOpen } from "@/store/reducers/auth/slice";
import { clearCheckoutCart } from "@/lib/clearCheckoutCart";
import type { CartItemResponse, ProductListItem } from "@smurfelite/types";
import {
  buildScopedCheckoutLines,
  expandProductIdsForOrder,
} from "@/lib/checkoutSyntheticLines";
import {
  findCheckoutAvailabilityIssues,
  isOrderUnavailableError,
} from "@/lib/checkoutAvailability";

export type CheckoutContentProps = {
  /** When provided, checkout uses only these products for summary + payment (not Redux cart lines). */
  productIds?: string[];
};

function buildProductIdsFromCart(
  items: Record<string, CartItemResponse>,
): string[] {
  const ids: string[] = [];
  for (const item of Object.values(items)) {
    for (let i = 0; i < item.quantity; i++) {
      ids.push(item.productId);
    }
  }
  return ids;
}

function errorMessageFromUnknown(err: unknown): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === "object" && d !== null && "message" in d) {
      const m = (d as { message: unknown }).message;
      if (typeof m === "string") return m;
    }
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export const CheckoutContent: React.FC<CheckoutContentProps> = ({
  productIds: scopedProductIdsProp,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, totalQuantity } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const scopedProductIds = useMemo(
    () =>
      (scopedProductIdsProp ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    [scopedProductIdsProp],
  );
  const isScoped = scopedProductIds.length > 0;

  const uniqueProductIds = useMemo(
    () => [...new Set(scopedProductIds)],
    [scopedProductIds],
  );

  const cartQuery = useGetCartQuery(undefined, {
    skip: !isAuthenticated || isScoped,
  });
  const isCartReady = !isAuthenticated || cartQuery.isSuccess;

  const cartUniqueProductIds = useMemo(() => {
    if (isScoped) return [];
    return [...new Set(Object.values(items).map((item) => item.productId))];
  }, [isScoped, items]);

  const idsToValidate = isScoped ? uniqueProductIds : cartUniqueProductIds;

  const [catalogLoadStatus, setCatalogLoadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [productById, setProductById] = useState<
    Map<string, ProductListItem>
  >(() => new Map());

  const catalogIdsKey = idsToValidate.join("|");

  useEffect(() => {
    const ids = catalogIdsKey
      ? [...new Set(catalogIdsKey.split("|").filter(Boolean))]
      : [];

    if (ids.length === 0) {
      setCatalogLoadStatus("idle");
      setProductById(new Map());
      return;
    }

    let cancelled = false;
    setCatalogLoadStatus("loading");

    void Promise.all(
      ids.map((id) =>
        dispatch(productsApi.endpoints.getProductById.initiate(id)).unwrap(),
      ),
    )
      .then((rows) => {
        if (cancelled) return;
        const m = new Map<string, ProductListItem>();
        for (const p of rows) m.set(p.id, p);
        setProductById(m);
        setCatalogLoadStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setProductById(new Map());
          setCatalogLoadStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, catalogIdsKey]);

  const catalogReady =
    idsToValidate.length === 0 ||
    (catalogLoadStatus === "success" &&
      productById.size === idsToValidate.length);

  const scopedProductError = isScoped && catalogLoadStatus === "error";
  const cartCatalogError =
    !isScoped && isAuthenticated && catalogLoadStatus === "error";

  const scopedLineItems = useMemo(() => {
    if (!isScoped || !catalogReady) return null;
    return buildScopedCheckoutLines(scopedProductIds, productById);
  }, [isScoped, catalogReady, scopedProductIds, productById]);

  const availabilityIssues = useMemo(() => {
    if (!catalogReady || idsToValidate.length === 0) return [];
    return findCheckoutAvailabilityIssues(idsToValidate, productById);
  }, [catalogReady, idsToValidate, productById]);

  const unavailableProductIds = useMemo(
    () => new Set(availabilityIssues.map((issue) => issue.productId)),
    [availabilityIssues],
  );

  const hasUnavailableItems = availabilityIssues.length > 0;

  const paymentReady = isScoped
    ? catalogReady &&
      (scopedLineItems?.length ?? 0) > 0 &&
      !hasUnavailableItems
    : isCartReady && catalogReady && !hasUnavailableItems;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paypalCheckout, setPaypalCheckout] = useState<{
    internalOrderId: string;
    paypalOrderId: string;
  } | null>(null);

  const [createOrder] = useCreateOrderMutation();
  const [createNowPaymentsInvoice] = useCreateNowPaymentsInvoiceMutation();
  const [createPayPalOrder] = useCreatePayPalOrderMutation();
  const [completeBypassPayment] = useCompleteBypassPaymentMutation();
  const { data: bypassStatus } = useGetPaymentBypassStatusQuery();
  const { data: paypalStatus } = useGetPayPalStatusQuery();
  const paymentBypassEnabled = bypassStatus?.enabled === true;
  const paypalClientConfigured = Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim()
  );
  const paypalEnabled =
    paypalClientConfigured && (paypalStatus?.enabled ?? false);

  const handlePaymentSubmit = async (method: PaymentMethod) => {
    setSubmitError(null);
    setPaypalCheckout(null);

    if (method !== "crypto" && method !== "paypal") {
      return;
    }

    if (!isAuthenticated) {
      dispatch(setIsLoginModalOpen(true));
      return;
    }

    if (hasUnavailableItems) {
      setSubmitError(
        "Remove unavailable items before completing your order.",
      );
      return;
    }

    if (isScoped) {
      if (!catalogReady || !scopedLineItems?.length) {
        setSubmitError(
          "Product details are still loading or unavailable. Please wait or return to the store.",
        );
        return;
      }
    } else {
      if (!cartQuery.isSuccess) {
        setSubmitError(
          "Your cart is still loading. Please wait a moment and try again.",
        );
        return;
      }
      if (!catalogReady) {
        setSubmitError(
          "Checking product availability. Please wait a moment and try again.",
        );
        return;
      }
    }

    const productIdsForOrder = isScoped
      ? expandProductIdsForOrder(scopedProductIds)
      : buildProductIdsFromCart(items);

    if (productIdsForOrder.length === 0 || (!isScoped && totalQuantity === 0)) {
      router.push("/cart");
      return;
    }

    setIsPaying(true);
    try {
      const order = await createOrder({ productIds: productIdsForOrder }).unwrap();

      if (paymentBypassEnabled) {
        await completeBypassPayment({ internalOrderId: order.id }).unwrap();
        await clearCheckoutCart(dispatch);
        router.push(`/checkout/success?orderId=${encodeURIComponent(order.id)}`);
        return;
      }

      if (method === "paypal") {
        const paypal = await createPayPalOrder({
          internalOrderId: order.id,
        }).unwrap();
        setPaypalCheckout({
          internalOrderId: order.id,
          paypalOrderId: paypal.paypalOrderId,
        });
        return;
      }

      const invoice = await createNowPaymentsInvoice({
        internalOrderId: order.id,
      }).unwrap();

      window.location.href = invoice.invoiceUrl;
    } catch (err) {
      const message = errorMessageFromUnknown(err);
      setSubmitError(
        isOrderUnavailableError(message)
          ? `${message} Refresh the page or return to the cart and remove unavailable items.`
          : message,
      );
    } finally {
      setIsPaying(false);
    }
  };

  const showCartLoadError = isAuthenticated && !isScoped && cartQuery.isError;

  const submitDisabledReason = hasUnavailableItems
    ? "Remove unavailable items"
    : !paymentReady
      ? "Loading…"
      : undefined;

  if (isScoped && scopedProductError) {
    return (
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p className="font-medium mb-2">We could not load this product.</p>
          <p className="mb-4">
            It may have been removed or the link is invalid. Browse available
            accounts to continue.
          </p>
          <Link
            href="/products"
            className="inline-flex font-semibold text-primary hover:underline"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-16">
        <div className="flex-1 flex flex-col gap-8">
          <CheckoutStepper paymentBypassEnabled={paymentBypassEnabled} />

          <CheckoutUnavailableAlert issues={availabilityIssues} />

          {(submitError || showCartLoadError || cartCatalogError) && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {submitError ??
                (cartCatalogError
                  ? "We could not verify product availability. Refresh the page or try again."
                  : "We could not load your cart. Refresh the page or return to the cart and try again.")}
            </div>
          )}

          <PaymentForm
            onSubmit={handlePaymentSubmit}
            isSubmitting={isPaying}
            submitDisabled={isAuthenticated && !paymentReady}
            submitDisabledReason={submitDisabledReason}
            paymentBypassEnabled={paymentBypassEnabled}
            paypalEnabled={paypalEnabled}
            hideSubmit={paypalCheckout !== null}
          />

          {paypalCheckout && (
            <div className="rounded-xl border border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-surface-dark p-6">
              <PayPalCheckoutButtons
                internalOrderId={paypalCheckout.internalOrderId}
                paypalOrderId={paypalCheckout.paypalOrderId}
                onSuccess={async () => {
                  await clearCheckoutCart(dispatch);
                  router.push(
                    `/checkout/success?orderId=${encodeURIComponent(paypalCheckout.internalOrderId)}`
                  );
                }}
                onCancel={() => setPaypalCheckout(null)}
              />
            </div>
          )}
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          <CheckoutOrderSummary
            lineItems={isScoped ? (scopedLineItems ?? []) : undefined}
            unavailableProductIds={unavailableProductIds}
          />
        </div>
      </div>
    </main>
  );
};
