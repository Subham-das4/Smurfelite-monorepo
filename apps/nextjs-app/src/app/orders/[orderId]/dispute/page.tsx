"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useCreateDisputeMutation, useGetOrderByIdQuery } from "@/api";
import { OrderStatus } from "@smurfelite/types";

const DISPUTE_REASONS = [
  "Credentials do not work",
  "Account details mismatch",
  "Product not as described",
  "Other issue",
] as const;

export default function OpenDisputePage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params.orderId;
  const initialProductId = searchParams.get("productId") ?? undefined;

  const { data: order, isLoading, isError } = useGetOrderByIdQuery(orderId);
  const [createDispute, { isLoading: isSubmitting }] = useCreateDisputeMutation();

  const [reasonCategory, setReasonCategory] = useState<string>(
    DISPUTE_REASONS[0],
  );
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState<string | undefined>(
    initialProductId,
  );

  const canDispute = order?.status === OrderStatus.COMPLETED;

  const selectedItem = useMemo(() => {
    if (!order) return undefined;
    if (productId) {
      return order.items.find((item) => item.productId === productId);
    }
    return order.items[0];
  }, [order, productId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!order || !canDispute) {
      toast.error("Only completed orders can be disputed.");
      return;
    }

    const reason = `${reasonCategory}: ${description.trim()}`;
    if (description.trim().length < 10) {
      toast.error("Please provide at least 10 characters describing the issue.");
      return;
    }

    const result = await createDispute({
      orderId: order.id,
      reason,
      details: {
        category: reasonCategory,
        description: description.trim(),
        productId: selectedItem?.productId,
        items: order.items.map((item) => ({
          productId: item.productId,
          title: item.product?.title,
          gameType: item.product?.gameType,
          priceAtPurchase: item.priceAtPurchase,
          quantity: item.quantity,
        })),
      },
    });

    if ("error" in result) {
      toast.error("Could not open dispute. Please try again.");
      return;
    }

    toast.success("Dispute submitted. Our team will review it shortly.");
    router.push("/orders");
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20 text-[#756189]">
        Loading order details...
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-rose-500">Order not found or access denied.</p>
        <Link href="/orders" className="text-primary font-medium hover:underline">
          Back to orders
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 py-8 md:px-10 lg:px-40">
      <div className="w-full max-w-[720px] flex flex-col gap-6">
        <nav className="flex flex-wrap gap-2 items-center text-sm">
          <Link href="/orders" className="text-[#756189] hover:text-primary">
            My Orders
          </Link>
          <span className="text-[#756189]">›</span>
          <span className="text-[#141118] dark:text-white font-medium">
            Open Dispute
          </span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-[#141118] dark:text-white">
            Open Dispute
          </h1>
          <p className="text-[#756189] dark:text-gray-400">
            Tell us what went wrong with order #{order.id.slice(0, 8)}. Order
            details are included automatically for support review.
          </p>
        </div>

        {!canDispute && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
            Disputes can only be opened for completed orders. This order is
            currently {order.status.toLowerCase()}.
          </div>
        )}

        <section className="rounded-2xl border border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-[#1e1829] p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#141118] dark:text-white">
            Order summary
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#756189]">Order ID</p>
              <p className="font-medium text-[#141118] dark:text-white">
                {order.id}
              </p>
            </div>
            <div>
              <p className="text-[#756189]">Total</p>
              <p className="font-medium text-[#141118] dark:text-white">
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[#756189]">Placed</p>
              <p className="font-medium text-[#141118] dark:text-white">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[#756189]">Status</p>
              <p className="font-medium text-[#141118] dark:text-white">
                {order.status}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {order.items.map((item) => {
              const title = item.product?.title ?? "Unknown product";
              const imageUrl = item.product?.imageUrl;
              const isSelected = selectedItem?.productId === item.productId;

              return (
                <button
                  key={item.productId}
                  type="button"
                  onClick={() => setProductId(item.productId)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-[#e0dbe6] dark:border-border-dark"
                  }`}
                >
                  <div className="size-12 rounded-lg overflow-hidden relative shrink-0 bg-gray-100 dark:bg-gray-800">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        unoptimized={imageUrl.startsWith("http")}
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#141118] dark:text-white truncate">
                      {title}
                    </p>
                    <p className="text-sm text-[#756189]">
                      {item.product?.gameType} · ${item.priceAtPurchase.toFixed(2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-[#1e1829] p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg font-bold text-[#141118] dark:text-white">
            Describe the issue
          </h2>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[#756189]">Issue type</span>
            <select
              value={reasonCategory}
              onChange={(event) => setReasonCategory(event.target.value)}
              className="rounded-xl border border-[#e0dbe6] dark:border-border-dark bg-transparent px-4 py-3"
              disabled={!canDispute || isSubmitting}
            >
              {DISPUTE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[#756189]">Details</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              required
              minLength={10}
              placeholder="Explain what happened and what you expected..."
              className="rounded-xl border border-[#e0dbe6] dark:border-border-dark bg-transparent px-4 py-3 resize-y"
              disabled={!canDispute || isSubmitting}
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={!canDispute || isSubmitting}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit dispute"}
            </button>
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#756189] hover:text-[#141118] dark:hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
