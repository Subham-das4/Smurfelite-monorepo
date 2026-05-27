"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCancelOrderMutation, useGetOrderByIdQuery } from "@/api/orders";
import { OrderStatus } from "@smurfelite/types";

function CheckoutCancelInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const cancelAttemptedRef = useRef(false);

  const { data: order, isLoading: isOrderLoading } = useGetOrderByIdQuery(
    orderId ?? "",
    { skip: !orderId },
  );

  const [cancelOrder, { isLoading: isCancelling, isSuccess, isError }] =
    useCancelOrderMutation();

  useEffect(() => {
    if (!orderId || cancelAttemptedRef.current || isOrderLoading) return;
    if (order?.status !== OrderStatus.PENDING) return;

    cancelAttemptedRef.current = true;
    void cancelOrder(orderId);
  }, [orderId, order?.status, isOrderLoading, cancelOrder]);

  const orderCancelled =
    isSuccess || order?.status === OrderStatus.CANCELLED;
  const cancelFailed = isError && order?.status === OrderStatus.PENDING;

  return (
    <div className="text-center">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Payment cancelled
      </h1>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
        {orderCancelled
          ? "Your pending order has been cancelled and the reserved items are available again. Your cart is unchanged — you can retry checkout when ready."
          : cancelFailed
            ? "We could not cancel your pending order automatically. Please cancel it from your orders page if you do not intend to pay."
            : isCancelling || (orderId && isOrderLoading)
              ? "Cancelling your pending order…"
              : "You left the crypto checkout before completing payment. Your cart is unchanged — you can try again when ready."}
      </p>
      {orderId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono break-all">
          Order ID: {orderId}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/checkout"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-bold hover:bg-primary/90 transition-colors"
        >
          Try again
        </Link>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Back to cart
        </Link>
        <Link
          href="/orders"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}

export function CheckoutCancelContent() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading…
        </p>
      }
    >
      <CheckoutCancelInner />
    </Suspense>
  );
}
