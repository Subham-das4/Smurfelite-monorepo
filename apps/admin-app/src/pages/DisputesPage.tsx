import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { DisputeResponse } from "@smurfelite/types";
import { DataTable, PageHeader, StatusBadge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useGetDisputesQuery, useUpdateDisputeStatusMutation } from "@/api/disputes";

const col = createColumnHelper<DisputeResponse>();

export function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useGetDisputesQuery({
    status: statusFilter || undefined,
  });
  const [updateStatus] = useUpdateDisputeStatusMutation();

  const columns = [
    col.accessor("orderId", { header: "Order" }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("reason", { header: "Reason" }),
    col.display({
      id: "resolve",
      header: "Resolve",
      cell: ({ row }) => (
        <select
          className="rounded border px-1 py-0.5 text-xs"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            updateStatus({ disputeId: row.original.id, status: v as DisputeResponse["status"] })
              .unwrap()
              .then(() => toast.success("Updated"));
            e.target.value = "";
          }}
        >
          <option value="">Set status…</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="RESOLVED_BUYER">RESOLVED_BUYER</option>
          <option value="RESOLVED_SELLER">RESOLVED_SELLER</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      ),
    }),
  ] as ColumnDef<DisputeResponse>[];

  const list = data ?? [];

  return (
    <>
      <PageHeader title="Disputes" />
      <select
        className="mb-4 rounded-lg border px-2 py-1 text-sm"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="OPEN">OPEN</option>
        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
      </select>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          data={list}
          columns={columns}
          pagination={{
            pageIndex: 0,
            pageSize: Math.max(list.length, 1),
            total: list.length,
            onPageChange: () => {},
          }}
          itemLabel="disputes"
        />
      )}
    </>
  );
}
