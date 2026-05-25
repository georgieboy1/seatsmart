import { listLayouts, createDefaultLayout } from "@/lib/layouts/actions";
import { Button } from "@/components/ui/button";
import { LayoutsList } from "./layouts-list";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function LayoutsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const layouts = await listLayouts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Classroom layouts
          </h1>
          <p className="text-sm text-muted-foreground">
            {layouts.length === 0
              ? "Model your classroom to get started."
              : `${layouts.length} layout${layouts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <form action={createDefaultLayout}>
          <Button type="submit">+ New layout</Button>
        </form>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <LayoutsList layouts={layouts} />
    </main>
  );
}
