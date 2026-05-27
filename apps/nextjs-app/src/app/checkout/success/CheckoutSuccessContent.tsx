"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGetOrderByIdQuery } from "@/api/orders";
import { OrderStatus } from "@smurfelite/types";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { clearCheckoutCart } from "@/lib/clearCheckoutCart";

const POLL_INTERVAL_MS = 3000;

function isPaymentConfirmed(status: OrderStatus | undefined): boolean {
  return (
    status === OrderStatus.COMPLETED || status === OrderStatus.PROCESSING
  );
}

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const cartClearedRef = useRef(false);

  const { data: order, isLoading } = useGetOrderByIdQuery(orderId ?? "", {
    skip: !orderId,
    pollingInterval: orderId && !isPaymentConfirmed(order?.status)
      ? POLL_INTERVAL_MS
      : 0,
  });

  useEffect(() => {
    if (
      !isAuthenticated ||
      cartClearedRef.current ||
      !isPaymentConfirmed(order?.status)
    ) {
      return;
    }

    cartClearedRef.current = true;
    void clearCheckoutCart(dispatch);
  }, [dispatch, isAuthenticated, order?.status]);

  const statusLabel =
    order?.status === OrderStatus.COMPLETED
      ? "Your order is complete. Account credentials are available in your order history."
      : order?.status === OrderStatus.PROCESSING
        ? "Payment received — your order is being processed."
        : order?.status === OrderStatus.PENDING
          ? "Waiting for payment confirmation. This page will update when your payment is confirmed."
          : order
            ? `Order status: ${order.status}.`
            : null;

  const isWaitingForPayment =
    order?.status === OrderStatus.PENDING || (orderId && isLoading && !order);

  return (
    <div className="text-center">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Thank you
      </h1>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
        {order?.status === OrderStatus.COMPLETED
          ? "Thank you for your purchase."
          : "If you completed payment on the crypto checkout page, we will confirm it shortly. You can safely close this tab — confirmation is sent to our servers automatically."}
      </p>
      {orderId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono break-all">
          Order ID: {orderId}
        </p>
      )}
      {isWaitingForPayment && (
        <p className="text-sm text-primary mb-4 animate-pulse">
          Checking payment status…
        </p>
      )}
      {orderId && isLoading && !order && (
        <p className="text-sm text-primary mb-4">Loading order status…</p>
      )}
      {statusLabel && (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-6">
          {statusLabel}
        </p>
      )}
      <Link
        href="/orders"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-bold hover:bg-primary/90 transition-colors"
      >
        View my orders
      </Link>
      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="text-primary font-medium hover:underline">
          Continue shopping
        </Link>
        {" · "}
        <Link href="/orders" className="text-primary font-medium hover:underline">
          View orders
        </Link>
      </p>
    </div>
  );
}

export function CheckoutSuccessContent() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading…
        </p>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
