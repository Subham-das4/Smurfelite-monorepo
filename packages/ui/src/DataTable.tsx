import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export interface TablePagination {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages: (number | "ellipsis")[] = [0];
  if (currentPage > 2) pages.push("ellipsis");
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 3) pages.push("ellipsis");
  pages.push(totalPages - 1);
  return pages;
}

export function DataTable<TData>({
  data,
  columns,
  pagination,
  emptyMessage = "No results found.",
  itemLabel = "results",
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination: TablePagination;
  emptyMessage?: string;
  itemLabel?: string;
}) {
  const { pageIndex, pageSize, total, onPageChange } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: { pagination: { pageIndex, pageSize } },
  });

  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] last:text-right"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--color-surface-muted)]">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm last:text-right">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          Showing <span className="font-semibold text-[var(--color-text)]">{from}-{to}</span> of{" "}
          <span className="font-semibold text-[var(--color-text)]">{total}</span> {itemLabel}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          {getPageNumbers(pageIndex, totalPages).map((page, idx) =>
            page === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-1 text-sm">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-8 rounded-lg px-2 py-1 text-sm ${
                  page === pageIndex
                    ? "bg-primary text-white"
                    : "border border-[var(--color-border)]"
                }`}
              >
                {page + 1}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1 || total === 0}
            className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
