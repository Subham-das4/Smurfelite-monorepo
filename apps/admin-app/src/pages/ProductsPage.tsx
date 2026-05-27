import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { AdminProductListItem } from "@smurfelite/types";
import { Button, DataTable, Input, PageHeader, StatusBadge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetAdminProductsQuery,
  useBanProductMutation,
  useLiftBanProductMutation,
} from "@/api/products";

const col = createColumnHelper<AdminProductListItem>();

export function ProductsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const pageSize = 15;
  const { data, isLoading } = useGetAdminProductsQuery({
    page: page + 1,
    pageSize,
    search: search || undefined,
  });
  const [ban] = useBanProductMutation();
  const [liftBan] = useLiftBanProductMutation();

  const columns = [
    col.accessor("title", {
      header: "Title",
      cell: (info) => (
        <Link
          to="/products/$productId"
          params={{ productId: info.row.original.id }}
          className="underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    col.accessor("sellerEmail", { header: "Seller" }),
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
        return p.status === "BANNED_BY_ADMIN" ? (
          <Button
            variant="secondary"
            onClick={() =>
              liftBan(p.id)
                .unwrap()
                .then(() => toast.success("Ban lifted"))
            }
          >
            Lift ban
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={() =>
              ban(p.id)
                .unwrap()
                .then(() => toast.success("Banned"))
            }
          >
            Ban
          </Button>
        );
      },
    }),
  ] as ColumnDef<AdminProductListItem>[];

  return (
    <>
      <PageHeader title="Products" description="All listings across sellers" />
      <Input
        className="mb-4 max-w-sm"
        placeholder="Search…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
      />
      {isLoading ? (
        <p className="text-sm">Loading…</p>
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
    </>
  );
}
