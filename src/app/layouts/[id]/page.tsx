import Link from "next/link";
import { redirect } from "next/navigation";
import { getLayout } from "@/lib/layouts/actions";

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
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/layouts"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All layouts
      </Link>
      <div className="mt-2 mb-8 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{layout.name}</h1>
        <p className="text-sm text-muted-foreground">
          {layout.type === "traditional"
            ? `${layout.rows} × ${layout.columns} traditional`
            : `${layout.numGroups} groups of ${layout.studentsPerGroup}`}
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        Layout builder coming in the next commit.
      </div>
    </main>
  );
}
