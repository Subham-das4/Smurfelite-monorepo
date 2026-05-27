import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { OrderResponse } from "@smurfelite/types";
import { DataTable, PageHeader, StatusBadge } from "@smurfelite/ui";
import { useGetAllOrdersQuery } from "@/api/orders";

const col = createColumnHelper<OrderResponse>();

export function OrdersPage() {
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const { data, isLoading } = useGetAllOrdersQuery({
    page: page + 1,
    pageSize,
  });

  const columns = [
    col.accessor("id", {
      header: "Order",
      cell: (info) => (
        <Link
          to="/orders/$orderId"
          params={{ orderId: info.getValue() }}
          className="font-mono text-xs underline"
        >
          {info.getValue().slice(0, 8)}…
        </Link>
      ),
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("paymentStatus", {
      header: "Payment",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("totalAmount", {
      header: "Total",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.accessor("createdAt", {
      header: "Created",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
  ] as ColumnDef<OrderResponse>[];

  return (
    <>
      <PageHeader title="Orders" />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          data={data?.orders ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="orders"
        />
      )}
    </>
  );
}
