import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Label,
  PageHeader,
  StatusBadge,
  Textarea,
} from "@smurfelite/ui";
import { toast } from "react-toastify";
import type { SellerApprovalStatus, SellerListItem } from "@smurfelite/types";
import {
  useGetSellersQuery,
  useCreateSellerMutation,
  useApproveSellerMutation,
  useRejectSellerMutation,
} from "@/api/sellers";
import { getApiErrorMessage } from "@/lib/apiError";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const satisfies readonly SellerApprovalStatus[];

const col = createColumnHelper<SellerListItem>();

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function SellersPage() {
  const [status, setStatus] = useState<SellerApprovalStatus>("PENDING");
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [approveTarget, setApproveTarget] = useState<SellerListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SellerListItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const pageSize = 15;

  const { data, isLoading } = useGetSellersQuery({
    status,
    page: page + 1,
    pageSize,
  });
  const [createSeller, { isLoading: isCreating }] = useCreateSellerMutation();
  const [approveSeller, { isLoading: isApproving }] = useApproveSellerMutation();
  const [rejectSeller, { isLoading: isRejecting }] = useRejectSellerMutation();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSeller({ email, name }).unwrap();
      toast.success("Seller invited — check email for temporary password.");
      setEmail("");
      setName("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to invite seller."));
    }
  };

  const onConfirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await approveSeller(approveTarget.id).unwrap();
      toast.success("Seller approved.");
      setApproveTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to approve seller."));
    }
  };

  const onConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectSeller({
        sellerId: rejectTarget.id,
        note: rejectNote.trim() || undefined,
      }).unwrap();
      toast.success("Seller rejected.");
      setRejectTarget(null);
      setRejectNote("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reject seller."));
    }
  };

  const columns = [
    col.accessor("email", { header: "Email" }),
    col.accessor("name", { header: "Name" }),
    col.accessor("sellerApprovalStatus", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("adminInvitedAt", {
      header: "Invited",
      cell: (info) => formatDate(info.getValue()),
    }),
    ...(status === "APPROVED"
      ? [
          col.accessor("sellerApprovedAt", {
            header: "Approved",
            cell: (info) => formatDate(info.getValue()),
          }),
        ]
      : []),
    ...(status === "REJECTED"
      ? [
          col.accessor("sellerRejectedAt", {
            header: "Rejected",
            cell: (info) => formatDate(info.getValue()),
          }),
          col.accessor("sellerRejectionNote", {
            header: "Note",
            cell: (info) => {
              const note = info.getValue();
              if (!note) return "—";
              return note.length > 80 ? `${note.slice(0, 80)}…` : note;
            },
          }),
        ]
      : []),
    ...(status === "PENDING"
      ? [
          col.display({
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
              const seller = row.original;
              return (
                <div className="flex flex-wrap justify-end gap-1">
                  <Button
                    variant="primary"
                    disabled={isApproving || isRejecting}
                    onClick={() => setApproveTarget(seller)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    disabled={isApproving || isRejecting}
                    onClick={() => {
                      setRejectTarget(seller);
                      setRejectNote("");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              );
            },
          }),
        ]
      : []),
  ] as ColumnDef<SellerListItem>[];

  return (
    <>
      <PageHeader
        title="Sellers"
        description="Review applications, invite sellers, approve or reject"
      />
      <form
        onSubmit={onCreate}
        className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"
      >
        <div>
          <Label htmlFor="seller-email">Email</Label>
          <Input
            id="seller-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="seller-name">Name</Label>
          <Input
            id="seller-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="self-end" disabled={isCreating}>
          Invite seller
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={status === s ? "primary" : "secondary"}
            onClick={() => {
              setStatus(s);
              setPage(0);
            }}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data?.sellers ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="sellers"
        />
      )}

      <ConfirmDialog
        open={!!approveTarget}
        title="Approve seller"
        message={
          approveTarget
            ? `Approve ${approveTarget.email}? They can list on the storefront.`
            : ""
        }
        confirmLabel={isApproving ? "Approving…" : "Approve"}
        variant="primary"
        onConfirm={onConfirmApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject seller"
        message={
          rejectTarget ? (
            <div className="space-y-3">
              <p>Reject {rejectTarget.email}? They will not appear on the storefront.</p>
              <div>
                <Label htmlFor="reject-note">Note (optional)</Label>
                <Textarea
                  id="reject-note"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          ) : (
            ""
          )
        }
        confirmLabel={isRejecting ? "Rejecting…" : "Reject"}
        variant="danger"
        onConfirm={onConfirmReject}
        onCancel={() => {
          setRejectTarget(null);
          setRejectNote("");
        }}
      />
    </>
  );
}
