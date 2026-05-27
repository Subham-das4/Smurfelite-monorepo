import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { GameResponse } from "@smurfelite/types";
import { Button, Input, Label, PageHeader, DataTable, Badge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetGamesQuery,
  useCreateGameMutation,
  useRestrictGameMutation,
  useDeleteGameMutation,
} from "@/api/games";

const col = createColumnHelper<GameResponse>();

export function GamesPage() {
  const { data: games = [], isLoading } = useGetGamesQuery();
  const [create] = useCreateGameMutation();
  const [restrict] = useRestrictGameMutation();
  const [remove] = useDeleteGameMutation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ name, slug: slug || undefined }).unwrap();
      toast.success("Game created");
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
        const g = row.original;
        return (
          <div className="flex flex-wrap justify-end gap-1">
            <Button
              variant="secondary"
              onClick={() =>
                restrict(g.id)
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
                remove(g.id)
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
  ] as ColumnDef<GameResponse>[];

  return (
    <>
      <PageHeader title="Games" description="Manage game names and listing restrictions" />
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
          Add game
        </Button>
      </form>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={games}
          columns={columns}
          pagination={{
            pageIndex: 0,
            pageSize: Math.max(games.length, 1),
            total: games.length,
            onPageChange: () => {},
          }}
          itemLabel="games"
        />
      )}
    </>
  );
}
