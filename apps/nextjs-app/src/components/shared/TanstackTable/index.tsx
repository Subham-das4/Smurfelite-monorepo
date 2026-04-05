"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export interface TablePagination {
  pageIndex: number; // 0-based
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
}

interface TanstackTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pagination: TablePagination;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
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

export function TanstackTable<TData>({
  data,
  columns,
  pagination,
}: TanstackTableProps<TData>) {
  const { pageIndex, pageSize, total, onPageChange } = pagination;
  const totalPages = Math.ceil(total / pageSize);

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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e0dbe6] dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-[#fcfbfc] dark:bg-white/5 border-b border-[#e0dbe6] dark:border-border-dark"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-[#756189] text-xs uppercase tracking-wider font-bold last:text-right"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#f2f0f4] dark:divide-border-dark">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center text-[#756189] dark:text-gray-400 text-sm"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-[#f9f8fa] dark:hover:bg-white/5 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 last:text-right">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-dark border-t border-[#e0dbe6] dark:border-border-dark">
        <p className="text-sm text-[#756189] dark:text-gray-400">
          Showing{" "}
          <span className="font-bold text-[#141118] dark:text-white">
            {from}-{to}
          </span>{" "}
          of{" "}
          <span className="font-bold text-[#141118] dark:text-white">
            {total}
          </span>{" "}
          orders
        </p>

        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="size-8 flex items-center justify-center rounded-lg border border-[#e0dbe6] dark:border-border-dark text-[#756189] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f2f0f4] dark:hover:bg-white/10 transition-colors"
            aria-label="Previous page"
          >
            <MdChevronLeft className="text-lg" />
          </button>

          {/* Page numbers */}
          {getPageNumbers(pageIndex, totalPages).map((page, idx) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="text-[#756189] text-sm px-1"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`size-8 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${
                  page === pageIndex
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-[#e0dbe6] dark:border-border-dark text-[#756189] hover:bg-[#f2f0f4] dark:hover:bg-white/10 hover:text-[#141118] dark:hover:text-white"
                }`}
              >
                {page + 1}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
            className="size-8 flex items-center justify-center rounded-lg border border-[#e0dbe6] dark:border-border-dark text-[#756189] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f2f0f4] dark:hover:bg-white/10 transition-colors"
            aria-label="Next page"
          >
            <MdChevronRight className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
