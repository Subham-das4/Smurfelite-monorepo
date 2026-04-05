"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { MdShoppingBag } from "react-icons/md";
import { TanstackTable } from "@/components/shared/TanstackTable";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderActionMenu } from "./OrderActionMenu";
import { OrdersFilters } from "./OrdersFilters";
import { OrdersHelpSection } from "./OrdersHelpSection";
import type { Order, OrderStatus, OrderStatusFilter, OrderSortOption } from "./types";

const PAGE_SIZE = 5;

const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor("id", {
    header: "Order ID",
    cell: (info) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm bg-[#f2f0f4] dark:bg-white/10 px-2 py-1 rounded-md">
        #{info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("gameAccount", {
    header: "Game Account",
    cell: (info) => {
      const { name, image } = info.getValue();
      return (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 relative">
            <Image src={image} alt={name} fill className="object-cover" />
          </div>
          <span className="text-[#141118] dark:text-white text-sm font-medium">
            {name}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("datePlaced", {
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
  columnHelper.accessor("total", {
    header: "Total",
    cell: (info) => (
      <span className="text-[#141118] dark:text-white font-bold text-sm">
        ${info.getValue().toFixed(2)}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <OrderStatusBadge status={info.getValue()} />,
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: (info) => (
      <OrderActionMenu
        orderId={info.row.original.id}
        status={info.row.original.status}
      />
    ),
  }),
];

function sortOrders(orders: Order[], sort: OrderSortOption): Order[] {
  return [...orders].sort((a, b) => {
    switch (sort) {
      case "newest":
        return new Date(b.datePlaced).getTime() - new Date(a.datePlaced).getTime();
      case "oldest":
        return new Date(a.datePlaced).getTime() - new Date(b.datePlaced).getTime();
      case "price-high":
        return b.total - a.total;
      case "price-low":
        return a.total - b.total;
    }
  });
}

interface OrdersContentProps {
  initialOrders: Order[];
}

export const OrdersContent: React.FC<OrdersContentProps> = ({
  initialOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [sort, setSort] = useState<OrderSortOption>("newest");
  const [pageIndex, setPageIndex] = useState(0);

  const filteredAndSorted = useMemo(() => {
    const filtered =
      statusFilter === "all"
        ? initialOrders
        : initialOrders.filter(
            (o) => o.status === (statusFilter as OrderStatus),
          );
    return sortOrders(filtered, sort);
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
        <nav className="flex flex-wrap gap-2 items-center text-sm" aria-label="Breadcrumb">
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
