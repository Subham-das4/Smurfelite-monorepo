import { useState } from "react";
import { Button, Input, Label, PageHeader } from "@smurfelite/ui";
import { toast } from "react-toastify";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useRestrictCategoryMutation,
  useDeleteCategoryMutation,
} from "@/api/categories";

export function CategoriesPage() {
  const { data, isLoading } = useGetCategoriesQuery();
  const [create] = useCreateCategoryMutation();
  const [restrict] = useRestrictCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ name, slug }).unwrap();
      toast.success("Category created");
      setName("");
      setSlug("");
    } catch {
      toast.error("Create failed");
    }
  };

  return (
    <>
      <PageHeader title="Game categories" />
      <form
        onSubmit={onCreate}
        className="mb-6 flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
      >
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
        <Button type="submit" className="self-end">
          Add category
        </Button>
      </form>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <span>
                {c.name} ({c.slug}){" "}
                {c.isRestricted ? (
                  <span className="text-amber-600">Restricted</span>
                ) : null}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    restrict(c.id)
                      .unwrap()
                      .then(() => toast.success("Toggled restrict"))
                  }
                >
                  Toggle restrict
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    remove(c.id)
                      .unwrap()
                      .then(() => toast.success("Deleted"))
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
