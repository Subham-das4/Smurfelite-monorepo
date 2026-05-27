import { useParams, useNavigate } from "@tanstack/react-router";
import { Button, PageHeader, StatusBadge } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetProductQuery,
  useBanProductMutation,
  useLiftBanProductMutation,
} from "@/api/products";

export function ProductDetailPage() {
  const { productId } = useParams({ strict: false }) as { productId: string };
  const navigate = useNavigate();
  const { data: product } = useGetProductQuery(productId);
  const [ban] = useBanProductMutation();
  const [liftBan] = useLiftBanProductMutation();

  if (!product) return <p>Loading…</p>;

  return (
    <>
      <PageHeader
        title={product.title}
        actions={
          <Button variant="secondary" onClick={() => navigate({ to: "/products" })}>
            Back
          </Button>
        }
      />
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm">
        <p>
          Status: <StatusBadge status={product.status} />
        </p>
        <p className="mt-2">Game: {product.gameType}</p>
        <p className="mt-2">Price: ${product.price.toFixed(2)}</p>
        <p className="mt-2">Seller ID: {product.sellerId}</p>
        <p className="mt-4 text-[var(--color-text-muted)]">
          Credentials are not shown here. View decrypted credentials on the completed order.
        </p>
        <div className="mt-4">
          {product.status === "BANNED_BY_ADMIN" ? (
            <Button
              onClick={() =>
                liftBan(productId)
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
                ban(productId)
                  .unwrap()
                  .then(() => toast.success("Banned"))
              }
            >
              Ban product
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
