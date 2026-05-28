import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { Button, Input, Label, PageHeader, Textarea } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useCreateProductMutation,
  useGetProductQuery,
  useUpdateProductMutation,
} from "@/api/products";
import { useGetGamesQuery } from "@/api/games";
import { useGetPlatformsQuery } from "@/api/platforms";
import type { RootState } from "@/store/store";
import { isSellerApproved } from "@/lib/sellerApproval";

export function ProductFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const productId = params.productId as string | undefined;
  const profile = useSelector((s: RootState) => s.user.profile);
  const canPublish = isSellerApproved(profile?.sellerApprovalStatus);

  const { data: product } = useGetProductQuery(productId!, {
    skip: mode === "create" || !productId,
  });
  const { data: games } = useGetGamesQuery();
  const { data: platforms } = useGetPlatformsQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const [gameId, setGameId] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [publishNow, setPublishNow] = useState(false);
  const [credentials, setCredentials] = useState({
    accountUsername: "",
    accountPassword: "",
    accountEmail: "",
    accountEmailPassword: "",
  });

  useEffect(() => {
    if (product && mode === "edit") {
      setTitle(product.title);
      setDescription(product.description ?? "");
      setPrice(String(product.price));
      setImageUrl(product.imageUrl ?? "");
      setGameId(product.gameId ?? "");
      setPlatformId(product.platformId ?? "");
      if (product.specifications && typeof product.specifications === "object") {
        const s: Record<string, string> = {};
        for (const [k, v] of Object.entries(product.specifications)) {
          s[k] = String(v);
        }
        setSpecs(s);
      }
    }
  }, [product, mode]);

  const addSpec = () => {
    if (!specKey.trim()) return;
    setSpecs((prev) => ({ ...prev, [specKey]: specValue }));
    setSpecKey("");
    setSpecValue("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) {
      toast.error("Select a game");
      return;
    }
    if (!platformId) {
      toast.error("Select a platform");
      return;
    }
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid price");
      return;
    }

    try {
      if (mode === "create") {
        await createProduct({
          gameId,
          platformId,
          title,
          description,
          price: priceNum,
          specifications: specs,
          sellerId: profile!.id,
          imageUrl: imageUrl || undefined,
          publish: publishNow,
          ...credentials,
        }).unwrap();
        toast.success(
          publishNow
            ? canPublish
              ? "Listing published"
              : "Draft created as active — visible on storefront after admin approval"
            : "Draft created"
        );
      } else if (productId) {
        const body: Record<string, unknown> = {
          gameId,
          platformId,
          title,
          description,
          price: priceNum,
          specifications: specs,
          imageUrl: imageUrl || undefined,
        };
        if (credentials.accountUsername) {
          Object.assign(body, credentials);
        }
        await updateProduct({ id: productId, body }).unwrap();
        toast.success("Product updated");
      }
      navigate({ to: "/products" });
    } catch {
      toast.error("Save failed");
    }
  };

  const readonly =
    mode === "edit" &&
    (product?.status === "SOLD" || product?.status === "BANNED_BY_ADMIN");

  const availableGames = games?.filter((g) => !g.isRestricted) ?? [];
  const availablePlatforms = platforms?.filter((p) => !p.isRestricted) ?? [];

  return (
    <>
      <PageHeader
        title={mode === "create" ? "New listing" : "Edit listing"}
        actions={
          <Button variant="secondary" onClick={() => navigate({ to: "/products" })}>
            Back
          </Button>
        }
      />
      {readonly ? (
        <p className="mb-4 text-sm text-amber-700">
          This listing cannot be edited ({product?.status}).
        </p>
      ) : null}
      <form
        onSubmit={onSubmit}
        className="max-w-2xl space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6"
      >
        <div>
          <Label>Game</Label>
          <select
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            required
            disabled={readonly}
          >
            <option value="">Select…</option>
            {availableGames.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Platform</Label>
          <select
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
            required
            disabled={readonly}
          >
            <option value="">Select…</option>
            {availablePlatforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={readonly}
          />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={readonly}
          />
        </div>
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={readonly}
          />
        </div>
        <div>
          <Label htmlFor="img">Image URL</Label>
          <Input
            id="img"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={readonly}
          />
        </div>
        <div>
          <Label>Specifications</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Key"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              disabled={readonly}
            />
            <Input
              placeholder="Value"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              disabled={readonly}
            />
            <Button type="button" variant="secondary" onClick={addSpec} disabled={readonly}>
              Add
            </Button>
          </div>
          <ul className="mt-2 text-sm text-[var(--color-text-muted)]">
            {Object.entries(specs).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        </div>
        <fieldset className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
          <legend className="text-sm font-semibold">
            {mode === "create" ? "Account credentials (required)" : "Replace credentials (optional)"}
          </legend>
          {mode === "edit" ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Leave blank to keep existing encrypted credentials.
            </p>
          ) : null}
          <Input
            placeholder="Username"
            value={credentials.accountUsername}
            onChange={(e) =>
              setCredentials((c) => ({ ...c, accountUsername: e.target.value }))
            }
            required={mode === "create"}
            disabled={readonly}
          />
          <Input
            placeholder="Password"
            type="password"
            value={credentials.accountPassword}
            onChange={(e) =>
              setCredentials((c) => ({ ...c, accountPassword: e.target.value }))
            }
            required={mode === "create"}
            disabled={readonly}
          />
          <Input
            placeholder="Email"
            value={credentials.accountEmail}
            onChange={(e) =>
              setCredentials((c) => ({ ...c, accountEmail: e.target.value }))
            }
            required={mode === "create"}
            disabled={readonly}
          />
          <Input
            placeholder="Email password"
            type="password"
            value={credentials.accountEmailPassword}
            onChange={(e) =>
              setCredentials((c) => ({
                ...c,
                accountEmailPassword: e.target.value,
              }))
            }
            required={mode === "create"}
            disabled={readonly}
          />
        </fieldset>
        {mode === "create" ? (
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishNow}
                disabled={!canPublish}
                onChange={(e) => setPublishNow(e.target.checked)}
              />
              Publish immediately
            </label>
            {!canPublish ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Available after admin approves your seller account. You can still
                save as draft.
              </p>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" disabled={readonly || creating || updating}>
          {mode === "create" ? "Create listing" : "Save changes"}
        </Button>
      </form>
    </>
  );
}
