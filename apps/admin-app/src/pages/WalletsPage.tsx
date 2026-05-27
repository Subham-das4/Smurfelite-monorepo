import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { AdminWalletListItem } from "@smurfelite/types";
import { Button, DataTable, Input, Label, PageHeader } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetWalletsQuery,
  useGetWalletLedgerQuery,
  useRecordPayoutMutation,
} from "@/api/wallets";

const col = createColumnHelper<AdminWalletListItem>();

export function WalletsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const pageSize = 15;

  const { data, isLoading } = useGetWalletsQuery({
    page: page + 1,
    pageSize,
    search: search || undefined,
  });
  const { data: ledger } = useGetWalletLedgerQuery(
    { sellerId: selectedSeller!, page: 1, pageSize: 20 },
    { skip: !selectedSeller }
  );
  const [recordPayout] = useRecordPayoutMutation();

  const columns = [
    col.accessor("sellerEmail", { header: "Seller" }),
    col.accessor("pendingBalance", {
      header: "Pending",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.accessor("availableBalance", {
      header: "Available",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.accessor("frozenBalance", {
      header: "Frozen",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="secondary" onClick={() => setSelectedSeller(row.original.sellerId)}>
          Ledger / payout
        </Button>
      ),
    }),
  ] as ColumnDef<AdminWalletListItem>[];

  return (
    <>
      <PageHeader title="Seller wallets" />
      <Input
        className="mb-4 max-w-sm"
        placeholder="Search seller…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
      />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          data={data?.wallets ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="wallets"
        />
      )}
      {selectedSeller ? (
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">Ledger & payout</h3>
          <ul className="my-3 max-h-48 overflow-auto text-xs">
            {(ledger?.entries ?? []).map((e) => (
              <li key={e.id} className="border-b py-1">
                {e.type} ${e.amount} — {e.note ?? ""}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} />
            </div>
            <Button
              onClick={() =>
                recordPayout({
                  sellerId: selectedSeller,
                  body: {
                    amount: parseFloat(payoutAmount),
                    note: payoutNote || undefined,
                  },
                })
                  .unwrap()
                  .then(() => toast.success("Payout recorded"))
              }
            >
              Record payout
            </Button>
            <Button variant="ghost" onClick={() => setSelectedSeller(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
