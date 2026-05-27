import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { DisputeResponse } from "@smurfelite/types";
import { DataTable, PageHeader, StatusBadge } from "@smurfelite/ui";
import { useGetMyDisputesQuery } from "@/api/disputes";

const col = createColumnHelper<DisputeResponse>();

export function DisputesPage() {
  const { data, isLoading } = useGetMyDisputesQuery();
  const [selected, setSelected] = useState<DisputeResponse | null>(null);

  const columns = [
    col.accessor("orderId", {
      header: "Order",
      cell: (info) => (
        <button
          type="button"
          className="font-mono text-xs text-primary underline"
          onClick={() => setSelected(info.row.original)}
        >
          {info.getValue().slice(0, 8)}…
        </button>
      ),
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("reason", { header: "Reason" }),
    col.accessor("createdAt", {
      header: "Opened",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
  ] as ColumnDef<DisputeResponse>[];

  return (
    <>
      <PageHeader title="Disputes" description="Read-only — contact admin to resolve" />
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data ?? []}
          columns={columns}
          pagination={{
            pageIndex: 0,
            pageSize: Math.max((data ?? []).length, 1),
            total: data?.length ?? 0,
            onPageChange: () => {},
          }}
          itemLabel="disputes"
          emptyMessage="No disputes."
        />
      )}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-auto bg-white p-6 shadow-xl">
            <button
              type="button"
              className="mb-4 text-sm text-[var(--color-text-muted)]"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <h2 className="text-lg font-bold">Dispute detail</h2>
            <p className="mt-2 text-sm">
              <StatusBadge status={selected.status} />
            </p>
            <p className="mt-4 text-sm">
              <strong>Reason:</strong> {selected.reason}
            </p>
            <pre className="mt-4 overflow-auto rounded-lg bg-[var(--color-surface-muted)] p-3 text-xs">
              {JSON.stringify(selected.details ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </>
  );
}
