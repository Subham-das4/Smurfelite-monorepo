import React from "react";
import { MdBlock } from "react-icons/md";
import type { OrderStatus } from "./types";

interface StatusConfig {
  className: string;
  dot?: React.ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  completed: {
    className:
      "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dot: (
      <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
    ),
    label: "Completed",
  },
  processing: {
    className:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    dot: (
      <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
    ),
    label: "Processing",
  },
  cancelled: {
    className:
      "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    dot: <MdBlock className="text-[14px]" />,
    label: "Cancelled",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
}) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.className}`}
    >
      {config.dot}
      {config.label}
    </span>
  );
};
