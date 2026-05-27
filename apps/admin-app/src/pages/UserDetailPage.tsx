import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { Button, ConfirmDialog, PageHeader, StatusBadge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import { useState } from "react";
import {
  useGetUserQuery,
  useGetUserProductsQuery,
  useUpdateRoleMutation,
  usePromoteSellerMutation,
  useDelistSellerMutation,
  useReactivateSellerMutation,
  useDeleteUserMutation,
} from "@/api/users";

export function UserDetailPage() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const navigate = useNavigate();
  const { data: user } = useGetUserQuery(userId);
  const { data: products } = useGetUserProductsQuery({ userId, page: 1 });
  const [updateRole] = useUpdateRoleMutation();
  const [promote] = usePromoteSellerMutation();
  const [delist] = useDelistSellerMutation();
  const [reactivate] = useReactivateSellerMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return <p>Loading…</p>;

  return (
    <>
      <PageHeader
        title={user.email}
        description={user.name}
        actions={
          <Button variant="secondary" onClick={() => navigate({ to: "/users" })}>
            Back
          </Button>
        }
      />
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p>
          Role: <StatusBadge status={user.role} />
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Last login:{" "}
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString()
            : "Never"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.role === "BUYER" && (
            <Button onClick={() => promote(userId).unwrap().then(() => toast.success("Promoted"))}>
              Promote to seller
            </Button>
          )}
          {user.role === "SELLER" && !user.sellerDelisted && (
            <Button variant="danger" onClick={() => delist(userId).unwrap().then(() => toast.success("Delisted"))}>
              Delist seller
            </Button>
          )}
          {user.role === "SELLER" && user.sellerDelisted && (
            <Button onClick={() => reactivate(userId).unwrap().then(() => toast.success("Reactivated"))}>
              Reactivate seller
            </Button>
          )}
          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={user.role}
            onChange={(e) =>
              updateRole({ userId, role: e.target.value })
                .unwrap()
                .then(() => toast.success("Role updated"))
            }
          >
            <option value="BUYER">BUYER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete user
          </Button>
        </div>
      </div>
      <h2 className="mb-2 font-semibold">Seller products</h2>
      <ul className="mb-6 list-disc pl-5 text-sm">
        {(products?.products ?? []).map((p) => (
          <li key={p.id}>
            <Link to="/products/$productId" params={{ productId: p.id }}>
              {p.title}
            </Link>{" "}
            <StatusBadge status={p.status} />
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete user?"
        message="Permanent deletion. Use with caution."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteUser(userId).unwrap();
          toast.success("User deleted");
          navigate({ to: "/users" });
        }}
      />
    </>
  );
}
