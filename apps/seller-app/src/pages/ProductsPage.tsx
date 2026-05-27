import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { ProductListItem } from "@smurfelite/types";
import {
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PageHeader,
  StatusBadge,
} from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetMyProductsQuery,
  usePublishProductMutation,
  useDelistProductMutation,
  useReactivateProductMutation,
  useDeleteProductMutation,
} from "@/api/products";

const col = createColumnHelper<ProductListItem>();

export function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useGetMyProductsQuery({
    page: page + 1,
    pageSize,
    search: search || undefined,
    status: status || undefined,
  });

  const [publish] = usePublishProductMutation();
  const [delist] = useDelistProductMutation();
  const [reactivate] = useReactivateProductMutation();
  const [remove] = useDeleteProductMutation();

  const columns = [
    col.accessor("title", { header: "Title" }),
    col.accessor("gameType", { header: "Game" }),
    col.accessor("platform", {
      header: "Platform",
      cell: (info) => info.getValue() ?? "—",
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("price", {
      header: "Price",
      cell: (info) => `$${info.getValue().toFixed(2)}`,
    }),
    col.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-wrap justify-end gap-1">
            <Button
              variant="ghost"
              onClick={() =>
                navigate({
                  to: "/products/$productId/edit",
                  params: { productId: p.id },
                })
              }
            >
              Edit
            </Button>
            {p.status === "DRAFT" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await publish(p.id).unwrap();
                    toast.success("Published");
                  } catch {
                    toast.error("Publish failed");
                  }
                }}
              >
                Publish
              </Button>
            )}
            {p.status === "ACTIVE" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await delist(p.id).unwrap();
                    toast.success("Delisted");
                  } catch {
                    toast.error("Delist failed");
                  }
                }}
              >
                Delist
              </Button>
            )}
            {p.status === "DELISTED_BY_SELLER" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await reactivate(p.id).unwrap();
                    toast.success("Reactivated");
                  } catch {
                    toast.error("Reactivate failed");
                  }
                }}
              >
                Republish
              </Button>
            )}
            {p.status !== "SOLD" && (
              <Button variant="danger" onClick={() => setDeleteId(p.id)}>
                Delete
              </Button>
            )}
          </div>
        );
      },
    }),
  ] as ColumnDef<ProductListItem>[];

  return (
    <>
      <PageHeader
        title="My products"
        description="Manage your listings"
        actions={
          <Link to="/products/new">
            <Button>Create listing</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search title…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <select
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DELISTED_BY_SELLER">DELISTED</option>
          <option value="SOLD">SOLD</option>
          <option value="BANNED_BY_ADMIN">BANNED</option>
        </select>
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data?.products ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="products"
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete product?"
        message="This soft-deletes the listing. It cannot be undone from the seller portal."
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await remove(deleteId).unwrap();
            toast.success("Deleted");
          } catch {
            toast.error("Delete failed");
          }
          setDeleteId(null);
        }}
      />
    </>
  );
}
