import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { PlatformResponse } from "@smurfelite/types";
import { Button, Input, Label, PageHeader, DataTable, Badge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetPlatformsQuery,
  useCreatePlatformMutation,
  useRestrictPlatformMutation,
  useDeletePlatformMutation,
} from "@/api/platforms";

const col = createColumnHelper<PlatformResponse>();

export function PlatformsPage() {
  const { data: platforms = [], isLoading } = useGetPlatformsQuery();
  const [create] = useCreatePlatformMutation();
  const [restrict] = useRestrictPlatformMutation();
  const [remove] = useDeletePlatformMutation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ name, slug: slug || undefined }).unwrap();
      toast.success("Platform created");
      setName("");
      setSlug("");
    } catch {
      toast.error("Create failed");
    }
  };

  const columns = [
    col.accessor("name", { header: "Name" }),
    col.accessor("slug", { header: "Slug" }),
    col.accessor("isRestricted", {
      header: "Status",
      cell: (info) =>
        info.getValue() ? (
          <Badge tone="warning">Restricted</Badge>
        ) : (
          <Badge tone="success">Active</Badge>
        ),
    }),
    col.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-wrap justify-end gap-1">
            <Button
              variant="secondary"
              onClick={() =>
                restrict(p.id)
                  .unwrap()
                  .then(() => toast.success("Toggled restrict"))
                  .catch(() => toast.error("Update failed"))
              }
            >
              Toggle restrict
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                remove(p.id)
                  .unwrap()
                  .then(() => toast.success("Deleted"))
                  .catch(() => toast.error("Delete failed"))
              }
            >
              Delete
            </Button>
          </div>
        );
      },
    }),
  ] as ColumnDef<PlatformResponse>[];

  return (
    <>
      <PageHeader
        title="Platforms"
        description="Manage account platforms and listing restrictions"
      />
      <form
        onSubmit={onCreate}
        className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"
      >
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Slug (optional)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <Button type="submit" className="self-end">
          Add platform
        </Button>
      </form>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={platforms}
          columns={columns}
          pagination={{
            pageIndex: 0,
            pageSize: Math.max(platforms.length, 1),
            total: platforms.length,
            onPageChange: () => {},
          }}
          itemLabel="platforms"
        />
      )}
    </>
  );
}
