import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { SellerSaleLine } from "@smurfelite/types";
import { DataTable, PageHeader, StatusBadge } from "@smurfelite/ui";
import { useGetSellerSalesQuery } from "@/api/sales";

const col = createColumnHelper<SellerSaleLine>();

export function SalesPage() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { data, isLoading } = useGetSellerSalesQuery({
    page: page + 1,
    pageSize,
  });

  const columns = [
    col.accessor("orderId", {
      header: "Order",
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue().slice(0, 8)}…</span>
      ),
    }),
    col.accessor("productTitle", { header: "Product" }),
    col.accessor("buyerEmail", { header: "Buyer" }),
    col.accessor("orderStatus", {
      header: "Order",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("paymentStatus", {
      header: "Payment",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("lineTotal", {
      header: "Total",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.accessor("soldAt", {
      header: "Updated",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
  ] as ColumnDef<SellerSaleLine>[];

  return (
    <>
      <PageHeader
        title="Sales"
        description="Read-only view of orders containing your products"
      />
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data?.sales ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="sales"
          emptyMessage="No sales yet."
        />
      )}
    </>
  );
}
