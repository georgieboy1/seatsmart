import Link from "next/link";
import { redirect } from "next/navigation";
import { getLayout } from "@/lib/layouts/actions";
import { LayoutBuilder } from "@/components/layout-builder/layout-builder";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function LayoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const layout = await getLayout(id);

  if (!layout) {
    redirect("/layouts?error=Layout+not+found");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/layouts"
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← All layouts
      </Link>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <LayoutBuilder key={layout.updatedAt} layout={layout} />
    </main>
  );
}
