import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { WalletLedgerEntry } from "@smurfelite/types";
import { DataTable, PageHeader, StatusBadge } from "@smurfelite/ui";
import { useGetMyWalletQuery, useGetMyLedgerQuery } from "@/api/wallet";

const col = createColumnHelper<WalletLedgerEntry>();

export function WalletPage() {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { data: wallet } = useGetMyWalletQuery();
  const { data: ledger, isLoading } = useGetMyLedgerQuery({
    page: page + 1,
    pageSize,
  });

  const columns = [
    col.accessor("type", {
      header: "Type",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("amount", {
      header: "Amount",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.accessor("orderId", {
      header: "Order",
      cell: (info) => info.getValue()?.slice(0, 8) ?? "—",
    }),
    col.accessor("note", { header: "Note" }),
    col.accessor("createdAt", {
      header: "Date",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
  ] as ColumnDef<WalletLedgerEntry>[];

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Balances are paid out manually by admin"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: wallet?.pendingBalance },
          { label: "Available", value: wallet?.availableBalance },
          { label: "Frozen", value: wallet?.frozenBalance },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
          >
            <p className="text-sm text-[var(--color-text-muted)]">{card.label}</p>
            <p className="text-2xl font-bold">
              ${(card.value ?? 0).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <h2 className="mb-3 text-lg font-semibold">Ledger</h2>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={ledger?.entries ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: ledger?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="entries"
        />
      )}
    </>
  );
}
