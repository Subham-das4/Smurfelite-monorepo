"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MdMoreVert,
  MdOpenInNew,
  MdKey,
  MdHelpOutline,
  MdReportProblem,
  MdCancel,
} from "react-icons/md";
import { toast } from "react-toastify";
import { OrderStatus } from "@smurfelite/types";
import { useCancelOrderMutation } from "@/api";
import { getApiErrorMessage } from "@/lib/apiError";
import type { OrderStatus as OrderStatusType } from "./types";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

function getMenuItems(
  orderId: string,
  productId: string,
  status: OrderStatusType,
  handlers: {
    onViewCredentials: () => void;
    onCancel: () => void;
    isCancelling: boolean;
  }
): MenuItem[] {
  const items: MenuItem[] = [
    {
      label: "View Order Details",
      icon: <MdOpenInNew className="text-base shrink-0" />,
      href: `/orders/${orderId}`,
    },
  ];

  if (status === OrderStatus.COMPLETED) {
    items.push(
      {
        label: "View Credentials",
        icon: <MdKey className="text-base shrink-0" />,
        onClick: handlers.onViewCredentials,
      },
      {
        label: "Open Dispute",
        icon: <MdReportProblem className="text-base shrink-0" />,
        href: `/orders/${orderId}/dispute?productId=${productId}`,
      }
    );
  }

  items.push({
    label: "Get Help with Order",
    icon: <MdHelpOutline className="text-base shrink-0" />,
    href: "/#contact_us",
  });

  if (status === OrderStatus.PENDING) {
    items.push({
      label: handlers.isCancelling ? "Cancelling…" : "Cancel Order",
      icon: <MdCancel className="text-base shrink-0" />,
      onClick: handlers.onCancel,
      variant: "danger",
      disabled: handlers.isCancelling,
    });
  }

  return items;
}

interface OrderActionMenuProps {
  orderId: string;
  productId: string;
  status: OrderStatusType;
  onViewCredentials: (orderId: string) => void;
}

export const OrderActionMenu: React.FC<OrderActionMenuProps> = ({
  orderId,
  productId,
  status,
  onViewCredentials,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleCancel = async () => {
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

  const menuItems = getMenuItems(orderId, productId, status, {
    onViewCredentials: () => onViewCredentials(orderId),
    onCancel: () => void handleCancel(),
    isCancelling,
  });

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Order actions"
        aria-expanded={open}
        className="size-8 flex items-center justify-center rounded-lg text-[#756189] dark:text-gray-400 hover:bg-[#f2f0f4] dark:hover:bg-white/10 hover:text-[#141118] dark:hover:text-white transition-colors"
      >
        <MdMoreVert className="text-xl" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-[#1e1829] rounded-xl border border-[#e0dbe6] dark:border-border-dark shadow-lg shadow-black/10 dark:shadow-black/40 overflow-hidden">
          <ul className="py-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.variant === "danger"
                        ? "text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        : "text-[#141118] dark:text-gray-200 hover:bg-[#f2f0f4] dark:hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors disabled:opacity-50 ${
                      item.variant === "danger"
                        ? "text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        : "text-[#141118] dark:text-gray-200 hover:bg-[#f2f0f4] dark:hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
