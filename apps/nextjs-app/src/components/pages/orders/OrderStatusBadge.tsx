import React from "react";
import { MdBlock } from "react-icons/md";
import { OrderStatus } from "@smurfelite/types";
import type { OrderStatus as OrderStatusType } from "./types";

interface StatusConfig {
  className: string;
  dot?: React.ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<OrderStatusType, StatusConfig> = {
  [OrderStatus.PENDING]: {
    className:
      "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600",
    dot: (
      <span className="size-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
    ),
    label: "Pending",
  },
  [OrderStatus.PROCESSING]: {
    className:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    dot: (
      <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
    ),
    label: "Processing",
  },
  [OrderStatus.COMPLETED]: {
    className:
      "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dot: (
      <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
    ),
    label: "Completed",
  },
  [OrderStatus.CANCELLED]: {
    className:
      "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    dot: <MdBlock className="text-[14px]" />,
    label: "Cancelled",
  },
  [OrderStatus.REFUNDED]: {
    className:
      "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    dot: <MdBlock className="text-[14px]" />,
    label: "Refunded",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatusType;
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
