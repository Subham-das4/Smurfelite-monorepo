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
import type { OrderStatus, OrderStatusFilter, OrderSortOption } from "./types";
import { OrderItemResponse } from "@smurfelite/types";

const PAGE_SIZE = 5;

const columnHelper = createColumnHelper<OrderItemResponse>();

const columns: ColumnDef<OrderItemResponse>[] = [
  {
    accessorKey: "orderId",
    header: "Order ID",
    cell: ({ row }) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm bg-[#f2f0f4] dark:bg-white/10 px-2 py-1 rounded-md">
        #{row.original.orderId}
      </span>
    ),
  },
  {
    accessorKey: "product.title",
    header: "Game Account",
    cell: ({ row }) => {
      const { title, imageUrl } = row.original.product!;
      return (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
            <Image
              src={imageUrl ?? ""}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-[#141118] dark:text-white text-sm font-medium">
            {title}
          </span>
        </div>
      );
    },
  },
  // {
  //   accessorKey: "createdAt",
  //   header: "Date Placed",
  //   cell: ({row}) => (
  //     <span className="text-[#756189] dark:text-gray-400 text-sm">
  //       {new Date(row.original.).toLocaleDateString("en-US", {
  //         month: "short",
  //         day: "numeric",
  //         year: "numeric",
  //       })}
  //     </span>
  //   ),
  // }),
  columnHelper.accessor("priceAtPurchase", {
    header: "Total",
    cell: (info) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm">
        ${info.getValue().toFixed(2)}
      </span>
    ),
  }),
  // columnHelper.accessor("status", {
  //   header: "Status",
  //   cell: (info) => <OrderStatusBadge status={info.getValue()} />,
  // }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: (info) => (
      <OrderActionMenu
        orderId={info.row.original.orderId}
        status={"completed"}
      />
    ),
  }),
];

function sortOrders(
  orders: OrderItemResponse[],
  sort: OrderSortOption,
): OrderItemResponse[] {
  return [...orders];
}

interface OrdersContentProps {
  initialOrders: OrderItemResponse[];
}

export const OrdersContent: React.FC<OrdersContentProps> = ({
  initialOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [sort, setSort] = useState<OrderSortOption>("newest");
  const [pageIndex, setPageIndex] = useState(0);

  const filteredAndSorted = useMemo(() => {
    return sortOrders(initialOrders, sort);
  }, [initialOrders, statusFilter, sort]);

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
        {/* Breadcrumbs */}
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

        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#e0dbe6] dark:border-border-dark pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#141118] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Order History
            </h1>
            <p className="text-[#756189] dark:text-gray-400 text-base max-w-2xl">
              View and manage your past game account purchases. Credentials for
              completed orders can be accessed via details.
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

        {/* Filters */}
        <OrdersFilters
          activeFilter={statusFilter}
          sort={sort}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />

        {/* Table */}
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

        {/* Help section */}
        <OrdersHelpSection />
      </div>
    </main>
  );
};
