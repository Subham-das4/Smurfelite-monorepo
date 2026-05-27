import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Button, PageHeader, StatusBadge, Label } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useLazyGetOrderCredentialsQuery,
} from "@/api/orders";

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const navigate = useNavigate();
  const { data: order } = useGetOrderQuery(orderId);
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [fetchCredentials, { data: credentials }] = useLazyGetOrderCredentialsQuery();
  const [newStatus, setNewStatus] = useState("");
  const [showCreds, setShowCreds] = useState(false);

  if (!order) return <p>Loading…</p>;

  return (
    <>
      <PageHeader
        title={`Order ${orderId.slice(0, 8)}…`}
        actions={
          <Button variant="secondary" onClick={() => navigate({ to: "/orders" })}>
            Back
          </Button>
        }
      />
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
        <p>
          Status: <StatusBadge status={order.status} />
        </p>
        <p className="mt-2">
          Payment: <StatusBadge status={order.paymentStatus} />
        </p>
        <p className="mt-2">Total: ${order.totalAmount.toFixed(2)}</p>
        <div className="mt-4 flex flex-wrap gap-2 items-end">
          <div>
            <Label>Override status</Label>
            <select
              className="rounded-lg border px-2 py-1"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Select…</option>
              {["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "REFUNDED"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>
          <Button
            variant="secondary"
            disabled={!newStatus}
            onClick={() =>
              updateStatus({ orderId, status: newStatus })
                .unwrap()
                .then(() => toast.success("Status updated (no fulfillment side effects)"))
            }
          >
            Apply
          </Button>
          {order.status === "COMPLETED" && (
            <Button
              onClick={async () => {
                await fetchCredentials(orderId);
                setShowCreds(true);
              }}
            >
              View credentials
            </Button>
          )}
        </div>
      </div>
      {showCreds && credentials ? (
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Decrypted credentials</h3>
          {credentials.credentials.map((c) => (
            <div key={c.productId} className="mb-4 rounded border p-3 text-xs font-mono">
              <p>{c.title}</p>
              <p>User: {c.accountUsername}</p>
              <p>Pass: {c.accountPassword}</p>
              <p>Email: {c.accountEmail}</p>
              <p>Email pass: {c.accountEmailPassword}</p>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setShowCreds(false)}>
            Close
          </Button>
        </div>
      ) : null}
    </>
  );
}
