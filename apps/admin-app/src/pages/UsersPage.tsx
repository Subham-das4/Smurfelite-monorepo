import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTable, Input, PageHeader, StatusBadge } from "@smurfelite/ui";
import { useGetUsersQuery } from "@/api/users";
import type { UserListItem } from "@/api/users";

const col = createColumnHelper<UserListItem>();

export function UsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const pageSize = 15;
  const { data, isLoading } = useGetUsersQuery({
    page: page + 1,
    pageSize,
    search: search || undefined,
  });

  const columns = [
    col.accessor("email", {
      header: "Email",
      cell: (info) => (
        <Link
          to="/users/$userId"
          params={{ userId: info.row.original.id }}
          className="text-primary underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    col.accessor("name", { header: "Name" }),
    col.accessor("role", {
      header: "Role",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    col.accessor("sellerDelisted", {
      header: "Seller delisted",
      cell: (info) => (info.getValue() ? "Yes" : "—"),
    }),
    col.accessor("lastLoginAt", {
      header: "Last login",
      cell: (info) =>
        info.getValue() ? new Date(info.getValue()!).toLocaleString() : "—",
    }),
  ] as ColumnDef<UserListItem>[];

  return (
    <>
      <PageHeader title="Users" description="Search and manage accounts" />
      <Input
        placeholder="Search email or name…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="mb-4 max-w-sm"
      />
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <DataTable
          data={data?.users ?? []}
          columns={columns}
          pagination={{
            pageIndex: page,
            pageSize,
            total: data?.meta.totalCount ?? 0,
            onPageChange: setPage,
          }}
          itemLabel="users"
        />
      )}
    </>
  );
}
