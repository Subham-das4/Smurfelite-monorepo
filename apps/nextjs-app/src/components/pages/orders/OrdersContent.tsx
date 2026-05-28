"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { MdShoppingBag } from "react-icons/md";
import { TanstackTable } from "@/components/shared/TanstackTable";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderActionMenu } from "./OrderActionMenu";
import { OrdersFilters } from "./OrdersFilters";
import { OrdersHelpSection } from "./OrdersHelpSection";
import type { OrderStatusFilter, OrderSortOption } from "./types";
import { useGetMyOrdersQuery } from "@/api";
import {
  flattenOrdersForTable,
  type OrderTableRow,
} from "@/lib/orderTableRows";

const PAGE_SIZE = 5;

const columnHelper = createColumnHelper<OrderTableRow>();

const columns = [
  {
    accessorKey: "orderId",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm bg-[#f2f0f4] dark:bg-white/10 px-2 py-1 rounded-md">
        #{row.original.orderId.slice(0, 8)}
      </span>
    ),
  },
  {
    accessorKey: "product.title",
    header: "Game Account",
    cell: ({ row }) => {
      const product = row.original.product;
      const title = product?.title ?? "Unknown product";
      const imageUrl = product?.imageUrl;
      return (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
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
          <span className="text-[#141118] dark:text-white text-sm font-medium">
            {title}
          </span>
        </div>
      );
    },
  },
  columnHelper.accessor("createdAt", {
    header: "Date Placed",
    cell: (info) => (
      <span className="text-[#756189] dark:text-gray-400 text-sm">
        {new Date(info.getValue()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  }),
  columnHelper.accessor("priceAtPurchase", {
    header: "Total",
    cell: (info) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm">
        ${info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor("orderStatus", {
    header: "Status",
    cell: (info) => <OrderStatusBadge status={info.getValue()} />,
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: (info) => (
      <OrderActionMenu
        orderId={info.row.original.orderId}
        productId={info.row.original.productId}
        status={info.row.original.orderStatus}
      />
    ),
  }),
] as ColumnDef<OrderTableRow>[];

function sortRows(
  rows: OrderTableRow[],
  sort: OrderSortOption,
): OrderTableRow[] {
  const copy = [...rows];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "price-high":
      return copy.sort((a, b) => b.priceAtPurchase - a.priceAtPurchase);
    case "price-low":
      return copy.sort((a, b) => a.priceAtPurchase - b.priceAtPurchase);
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function filterRows(
  rows: OrderTableRow[],
  statusFilter: OrderStatusFilter,
): OrderTableRow[] {
  if (statusFilter === "all") return rows;
  return rows.filter((row) => row.orderStatus === statusFilter);
}

export const OrdersContent: React.FC = () => {
  const { data: orders = [], isLoading, isError } = useGetMyOrdersQuery();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [sort, setSort] = useState<OrderSortOption>("newest");
  const [pageIndex, setPageIndex] = useState(0);

  const tableRows = useMemo(() => flattenOrdersForTable(orders), [orders]);

  const filteredAndSorted = useMemo(() => {
    return sortRows(filterRows(tableRows, statusFilter), sort);
  }, [tableRows, statusFilter, sort]);

  const paginatedData = useMemo(
    () =>
      filteredAndSorted.slice(
        pageIndex * PAGE_SIZE,
        (pageIndex + 1) * PAGE_SIZE,
      ),
    [filteredAndSorted, pageIndex],
  );

  const handleFilterChange = (filter: OrderStatusFilter) => {
    setStatusFilter(filter);
    setPageIndex(0);
  };

  const handleSortChange = (newSort: OrderSortOption) => {
    setSort(newSort);
    setPageIndex(0);
  };

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 py-8 md:px-10 lg:px-40">
      <div className="flex flex-col w-full max-w-[1200px] gap-6">
        <nav
          className="flex flex-wrap gap-2 items-center text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="text-[#756189] dark:text-gray-400 hover:text-primary font-medium transition-colors"
          >
            Home
          </Link>
          <span className="text-[#756189] dark:text-gray-500">›</span>
          <span className="text-[#141118] dark:text-white font-medium">
            My Orders
          </span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#e0dbe6] dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#141118] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Order History
            </h1>
            <p className="text-[#756189] dark:text-gray-400 text-base max-w-2xl">
              View and manage your past game account purchases. Open a dispute on
              completed orders if something went wrong.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <MdShoppingBag className="text-xl" />
            Browse Shop
          </Link>
        </div>

        <OrdersFilters
          activeFilter={statusFilter}
          sort={sort}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />

        {isLoading ? (
          <div className="py-16 text-center text-[#756189] dark:text-gray-400">
            Loading your orders...
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-500">
            Could not load orders. Please sign in and try again.
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-16 text-center text-[#756189] dark:text-gray-400">
            No orders found for this filter.
          </div>
        ) : (
          <TanstackTable
            data={paginatedData}
            columns={columns}
            pagination={{
              pageIndex,
              pageSize: PAGE_SIZE,
              total: filteredAndSorted.length,
              onPageChange: setPageIndex,
            }}
          />
        )}

        <OrdersHelpSection />
      </div>
    </main>
  );
};
