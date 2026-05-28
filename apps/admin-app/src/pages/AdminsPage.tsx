import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useSelector } from "react-redux";
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Label,
  PageHeader,
} from "@smurfelite/ui";
import { toast } from "react-toastify";
import type { AdminListItem } from "@smurfelite/types";
import {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useDeleteAdminMutation,
} from "@/api/admins";
import { getApiErrorMessage } from "@/lib/apiError";
import type { RootState } from "@/store/store";

const col = createColumnHelper<AdminListItem>();

export function AdminsPage() {
  const profile = useSelector((s: RootState) => s.user.profile);
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminListItem | null>(null);
  const pageSize = 15;

  const { data, isLoading } = useGetAdminsQuery({
    page: page + 1,
    pageSize,
  });
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdmin({ email, name }).unwrap();
      toast.success("Admin invited — check email for temporary password.");
      setEmail("");
      setName("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create admin."));
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdmin(deleteTarget.id).unwrap();
      toast.success("Admin removed.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove admin."));
    }
  };

  const columns = [
    col.accessor("email", { header: "Email" }),
    col.accessor("name", { header: "Name" }),
    col.accessor("lastLoginAt", {
      header: "Last login",
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()!).toLocaleString()
          : "—",
    }),
    col.accessor("adminInvitedAt", {
      header: "Invited",
      cell: (info) =>
        info.getValue()
          ? new Date(info.getValue()!).toLocaleString()
          : "—",
    }),
    col.accessor("createdAt", {
      header: "Created",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    col.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const admin = row.original;
        const isSelf = admin.id === profile?.id;
        return (
          <div className="flex justify-end">
            {isSelf ? (
              <span className="text-sm text-[var(--color-text-muted)]">You</span>
            ) : (
              <Button
                variant="danger"
                onClick={() => setDeleteTarget(admin)}
              >
                Remove
              </Button>
            )}
          </div>
        );
      },
    }),
  ] as ColumnDef<AdminListItem>[];

  return (
    <>
      <PageHeader
        title="Admins"
        description="Provision and remove admin accounts"
      />
      <form
        onSubmit={onCreate}
        className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"
      >
        <div>
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="admin-name">Name</Label>
          <Input
            id="admin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="self-end" disabled={isCreating}>
          Add admin
        </Button>
      </form>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data?.admins ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="admins"
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove admin"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.email}? They will lose admin access.`
            : ""
        }
        confirmLabel={isDeleting ? "Removing…" : "Remove"}
        variant="danger"
        onConfirm={onConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
