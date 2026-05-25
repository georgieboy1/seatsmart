import type { CellType } from "@/lib/types/layout";
import { CELL_META } from "./cell-meta";

const LEGEND_ORDER: CellType[] = [
  "seat",
  "empty",
  "perimeter",
  "door",
  "window",
  "teacher_desk",
  "whiteboard",
  "charging_station",
];

export function Legend() {
  return (
    <aside className="space-y-3 rounded-md border p-4">
      <h2 className="text-sm font-semibold">Legend</h2>
      <ul className="space-y-1">
        {LEGEND_ORDER.map((type) => {
          const meta = CELL_META[type];
          return (
            <li key={type} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className={`flex h-6 w-6 items-center justify-center rounded-sm border text-[10px] font-medium ${meta.bg} ${meta.border} ${meta.text}`}
              >
                {meta.label}
              </span>
              <span>{meta.fullName}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
