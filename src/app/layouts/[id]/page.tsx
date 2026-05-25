import Link from "next/link";
import { redirect } from "next/navigation";
import { getLayout } from "@/lib/layouts/actions";
import { LayoutBuilder } from "@/components/layout-builder/layout-builder";

export const dynamic = "force-dynamic";

export default async function LayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <LayoutBuilder layout={layout} />
    </main>
  );
}
