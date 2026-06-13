"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { OrderStatus } from "@smurfelite/types";
import {
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useCreateNowPaymentsInvoiceMutation,
  useCreatePayPalOrderMutation,
  useGetPayPalStatusQuery,
  useGetNowPaymentsStatusQuery,
} from "@/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { payOrderWithCrypto } from "@/lib/payWithCrypto";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderCredentialsModal } from "./OrderCredentialsModal";
import { OrderPayPalModal } from "./OrderPayPalModal";

export function OrderDetailContent() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = params.orderId;
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(orderId);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [createInvoice, { isLoading: isPayingCrypto }] =
    useCreateNowPaymentsInvoiceMutation();
  const [createPayPalOrder, { isLoading: isPayingPayPal }] =
    useCreatePayPalOrderMutation();
  const { data: paypalStatus } = useGetPayPalStatusQuery();
  const { data: nowPaymentsStatus } = useGetNowPaymentsStatusQuery();
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [paypalModal, setPaypalModal] = useState<{
    paypalOrderId: string;
  } | null>(null);

  const paypalEnabled =
    Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim()) &&
    (paypalStatus?.enabled ?? false);
  const cryptoEnabled = nowPaymentsStatus?.enabled ?? false;

  const handleCancel = async () => {
    if (!order || order.status !== OrderStatus.PENDING) return;
    const confirmed = window.confirm(
      "Cancel this pending order? Reserved products will be released."
    );
    if (!confirmed) return;

    try {
      await cancelOrder(orderId).unwrap();
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel order."));
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20 text-[#756189]">
        Loading order…
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-rose-500">Order not found or access denied.</p>
        <Link href="/orders" className="text-primary font-semibold hover:underline">
          Back to orders
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 py-8 md:px-10 lg:px-40">
      <OrderCredentialsModal
        orderId={orderId}
        open={credentialsOpen}
        onClose={() => setCredentialsOpen(false)}
      />
      <OrderPayPalModal
        internalOrderId={orderId}
        paypalOrderId={paypalModal?.paypalOrderId ?? ""}
        open={paypalModal !== null}
        onClose={() => setPaypalModal(null)}
        onSuccess={() => {
          toast.success("Payment complete.");
          router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
        }}
      />

      <div className="w-full max-w-[800px] space-y-6">
        <nav className="text-sm text-[#756189] dark:text-gray-400">
          <Link href="/orders" className="hover:text-primary">
            Orders
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[#141118] dark:text-white font-medium">
            #{order.id.slice(0, 8)}
          </span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#141118] dark:text-white">
            Order details
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="rounded-2xl border border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-surface-dark p-6 space-y-4">
          <p className="text-sm text-[#756189] dark:text-gray-400">
            Placed{" "}
            {new Date(order.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="text-lg font-bold text-[#141118] dark:text-white">
            Total: ${order.totalAmount.toFixed(2)}
          </p>

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-3 border-t border-[#e0dbe6] dark:border-border-dark pt-3 first:border-0 first:pt-0"
              >
                {item.product?.imageUrl ? (
                  <div className="relative size-12 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      unoptimized={item.product.imageUrl.startsWith("http")}
                    />
                  </div>
                ) : null}
                <div>
                  <p className="font-medium text-[#141118] dark:text-white">
                    {item.product?.title ?? "Product"}
                  </p>
                  <p className="text-sm text-[#756189]">
                    ${item.priceAtPurchase.toFixed(2)} × {item.quantity}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          {order.status === OrderStatus.PENDING && (
            <>
              {paypalEnabled && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const result = await createPayPalOrder({
                        internalOrderId: orderId,
                      }).unwrap();
                      setPaypalModal({
                        paypalOrderId: result.paypalOrderId,
                      });
                    } catch (err) {
                      toast.error(
                        getApiErrorMessage(err, "Could not start PayPal payment.")
                      );
                    }
                  }}
                  disabled={isPayingPayPal || isPayingCrypto || isCancelling}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#e0dbe6] dark:border-border-dark hover:bg-[#f2f0f4] dark:hover:bg-white/10 disabled:opacity-60"
                >
                  {isPayingPayPal ? "Starting PayPal…" : "Pay with PayPal"}
                </button>
              )}
              {cryptoEnabled && (
                <button
                  type="button"
                  onClick={() =>
                    void payOrderWithCrypto(orderId, (args) =>
                      createInvoice(args).unwrap()
                    )
                  }
                  disabled={isPayingCrypto || isPayingPayPal || isCancelling}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPayingCrypto ? "Starting payment…" : "Pay with crypto"}
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  isCancelling || isPayingCrypto || isPayingPayPal
                }
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-60"
              >
                {isCancelling ? "Cancelling…" : "Cancel order"}
              </button>
            </>
          )}
          {order.status === OrderStatus.COMPLETED && (
            <>
              <button
                type="button"
                onClick={() => setCredentialsOpen(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90"
              >
                View credentials
              </button>
              <Link
                href={`/orders/${orderId}/dispute?productId=${order.items[0]?.productId ?? ""}`}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[#e0dbe6] dark:border-border-dark hover:bg-[#f2f0f4] dark:hover:bg-white/10"
              >
                Open dispute
              </Link>
            </>
          )}
          <Link
            href="/orders"
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#756189] hover:underline"
          >
            Back to orders
          </Link>
        </div>
      </div>
    </main>
  );
}
