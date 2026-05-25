import type { CellType } from "@/lib/types/layout";
import { CELL_META } from "./cell-meta";

export function GridView({ grid }: { grid: CellType[][] }) {
  if (grid.length === 0 || grid[0].length === 0) return null;
  const columns = grid[0].length;

  return (
    <div
      role="grid"
      aria-label="Classroom layout"
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 2.5rem))` }}
    >
      {grid.flatMap((row, r) =>
        row.map((cell, c) => {
          const meta = CELL_META[cell];
          return (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              aria-label={`${meta.fullName} at row ${r}, column ${c}`}
              className={`aspect-square flex items-center justify-center rounded-sm border text-xs font-medium ${meta.bg} ${meta.border} ${meta.text}`}
            >
              {meta.label}
            </div>
          );
        }),
      )}
    </div>
  );
}
