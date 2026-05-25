import Link from "next/link";
import type { ClassroomLayout } from "@/lib/types/layout";

export function LayoutsList({ layouts }: { layouts: ClassroomLayout[] }) {
  if (layouts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-base font-medium">No layouts yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Click <span className="font-medium">+ New layout</span> above to
          create your first classroom layout.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {layouts.map((layout) => (
        <li key={layout.id}>
          <Link
            href={`/layouts/${layout.id}`}
            className="block rounded-md border p-4 transition-colors hover:bg-accent"
          >
            <p className="font-medium">{layout.name}</p>
            <p className="text-sm text-muted-foreground">
              {layout.type === "traditional"
                ? `${layout.rows ?? 0} × ${layout.columns ?? 0} traditional`
                : `${layout.numGroups ?? 0} groups of ${layout.studentsPerGroup ?? 0}`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
