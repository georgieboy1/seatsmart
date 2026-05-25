import type { ClassroomLayout } from "@/lib/types/layout";
import { LayoutListItem } from "./layout-list-item";

export function LayoutsList({ layouts }: { layouts: ClassroomLayout[] }) {
  if (layouts.length === 0) {
    return (
      <div className="border-[1.5px] border-dashed border-foreground/30 p-12 text-center">
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
        <LayoutListItem key={layout.id} layout={layout} />
      ))}
    </ul>
  );
}
