"use client";

import React from "react";
import { MdFilterList, MdExpandMore } from "react-icons/md";
import type { OrderStatusFilter, OrderSortOption } from "./types";

const STATUS_TABS: { id: OrderStatusFilter; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "completed", label: "Completed" },
  { id: "processing", label: "Processing" },
  { id: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS: { value: OrderSortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
];

interface OrdersFiltersProps {
  activeFilter: OrderStatusFilter;
  sort: OrderSortOption;
  onFilterChange: (filter: OrderStatusFilter) => void;
  onSortChange: (sort: OrderSortOption) => void;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  activeFilter,
  sort,
  onFilterChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-2 rounded-2xl border border-[#e0dbe6] dark:border-border-dark">
      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto w-full md:w-auto p-1 no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 transition-colors ${
              activeFilter === tab.id
                ? "bg-[#141118] dark:bg-primary text-white"
                : "bg-transparent hover:bg-[#f2f0f4] dark:hover:bg-white/10 text-[#756189] dark:text-gray-400 hover:text-[#141118] dark:hover:text-white"
            }`}
          >
            <p className={`text-sm ${activeFilter === tab.id ? "font-bold" : "font-medium"}`}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-3 w-full md:w-auto pr-2">
        <div className="relative w-full md:w-64">
          <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-[#756189] text-xl pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as OrderSortOption)}
            className="w-full bg-[#f2f0f4] dark:bg-white/10 border-none text-sm font-medium text-[#141118] dark:text-white rounded-xl py-2 pl-10 pr-8 focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756189] text-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
