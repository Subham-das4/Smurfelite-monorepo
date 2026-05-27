"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckoutStepper } from "./CheckoutStepper";
import { ShippingForm } from "./ShippingForm";
import { PaymentForm } from "./PaymentForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import type { CheckoutStep, PaymentMethod, ShippingFormData } from "./types";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { productsApi } from "@/api/products";
import { useGetCartQuery, useRemoveFromCartMutation } from "@/api/cart";
import { useCreateOrderMutation } from "@/api/orders";
import { useCreateNowPaymentsInvoiceMutation } from "@/api/payments";
import { setIsLoginModalOpen } from "@/store/reducers/auth/slice";
import { clearCart } from "@/store/reducers/cart/slice";
import type { CartItemResponse, ProductListItem } from "@smurfelite/types";
import {
  buildScopedCheckoutLines,
  expandProductIdsForOrder,
} from "@/lib/checkoutSyntheticLines";

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

  const [scopedLoadStatus, setScopedLoadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [productById, setProductById] = useState<
    Map<string, ProductListItem>
  >(() => new Map());

  const scopedIdsKey = uniqueProductIds.join("|");

  useEffect(() => {
    const ids = scopedIdsKey
      ? [...new Set(scopedIdsKey.split("|").filter(Boolean))]
      : [];
    if (!isScoped || ids.length === 0) {
      setScopedLoadStatus("idle");
      setProductById(new Map());
      return;
    }

    let cancelled = false;
    setScopedLoadStatus("loading");

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
        setScopedLoadStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setProductById(new Map());
          setScopedLoadStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, isScoped, scopedIdsKey]);

  const scopedProductsReady =
    !isScoped ||
    (scopedLoadStatus === "success" && productById.size === uniqueProductIds.length);

  const scopedProductError = isScoped && scopedLoadStatus === "error";

  const scopedLineItems = useMemo(() => {
    if (!isScoped || !scopedProductsReady) return null;
    return buildScopedCheckoutLines(scopedProductIds, productById);
  }, [isScoped, scopedProductsReady, scopedProductIds, productById]);

  const paymentReady = isScoped
    ? scopedProductsReady && (scopedLineItems?.length ?? 0) > 0
    : isCartReady;

  const [step, setStep] = useState<CheckoutStep>(1);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const [createOrder] = useCreateOrderMutation();
  const [createNowPaymentsInvoice] = useCreateNowPaymentsInvoiceMutation();
  const [removeFromCartApi] = useRemoveFromCartMutation();

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setStep(2);
  };

  const handlePaymentSubmit = async (method: PaymentMethod) => {
    setSubmitError(null);

    if (method !== "crypto") {
      return;
    }

    if (!isAuthenticated) {
      dispatch(setIsLoginModalOpen(true));
      return;
    }

    if (isScoped) {
      if (!scopedProductsReady || !scopedLineItems?.length) {
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
      const invoice = await createNowPaymentsInvoice({
        internalOrderId: order.id,
      }).unwrap();

      if (isScoped) {
        const unique = [...new Set(scopedProductIds)];
        for (const id of unique) {
          try {
            await removeFromCartApi(id).unwrap();
          } catch {
            // Item may not exist in server cart; checkout still succeeded.
          }
        }
      } else {
        dispatch(clearCart());
      }

      window.location.href = invoice.invoiceUrl;
    } catch (err) {
      setSubmitError(errorMessageFromUnknown(err));
    } finally {
      setIsPaying(false);
    }
  };

  const showCartLoadError = isAuthenticated && !isScoped && cartQuery.isError;

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
          <CheckoutStepper currentStep={step} />

          {(submitError || showCartLoadError) && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {submitError ??
                "We could not load your cart. Refresh the page or return to the cart and try again."}
            </div>
          )}

          {step === 1 && (
            <ShippingForm
              defaultValues={shippingData ?? undefined}
              onSubmit={handleShippingSubmit}
            />
          )}

          {step === 2 && shippingData && (
            <PaymentForm
              shippingData={shippingData}
              onBack={() => setStep(1)}
              onSubmit={handlePaymentSubmit}
              isSubmitting={isPaying}
              submitDisabled={isAuthenticated && !paymentReady}
            />
          )}
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          <CheckoutOrderSummary
            lineItems={isScoped ? (scopedLineItems ?? []) : undefined}
          />
        </div>
      </div>
    </main>
  );
};
