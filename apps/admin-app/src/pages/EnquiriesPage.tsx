import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { EnquiryResponse } from "@smurfelite/types";
import { Button, DataTable, PageHeader } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetEnquiriesQuery,
  useCloseEnquiryMutation,
  useDeleteEnquiryMutation,
} from "@/api/enquiries";

const col = createColumnHelper<EnquiryResponse>();

export function EnquiriesPage() {
  const { data, isLoading } = useGetEnquiriesQuery();
  const [close] = useCloseEnquiryMutation();
  const [remove] = useDeleteEnquiryMutation();

  const columns = [
    col.accessor("email", { header: "Email" }),
    col.accessor("name", { header: "Name" }),
    col.accessor("subject", { header: "Subject" }),
    col.accessor("isClosed", {
      header: "Closed",
      cell: (info) => (info.getValue() ? "Yes" : "Open"),
    }),
    col.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          {!row.original.isClosed && (
            <Button
              variant="secondary"
              onClick={() =>
                close(row.original.id)
                  .unwrap()
                  .then(() => toast.success("Closed"))
              }
            >
              Close
            </Button>
          )}
          <Button
            variant="danger"
            onClick={() =>
              remove(row.original.id)
                .unwrap()
                .then(() => toast.success("Deleted"))
            }
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ] as ColumnDef<EnquiryResponse>[];

  const list = data ?? [];

  return (
    <>
      <PageHeader title="Enquiries" />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <DataTable
          data={list}
          columns={columns}
          pagination={{
            pageIndex: 0,
            pageSize: Math.max(list.length, 1),
            total: list.length,
            onPageChange: () => {},
          }}
          itemLabel="enquiries"
        />
      )}
    </>
  );
}
