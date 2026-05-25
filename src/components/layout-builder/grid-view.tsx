import type { CellType } from "@/lib/types/layout";
import { CELL_META } from "./cell-meta";

type Props = {
  grid: CellType[][];
  onCellClick?: (r: number, c: number) => void;
};

export function GridView({ grid, onCellClick }: Props) {
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
          const label = `${meta.fullName} at row ${r}, column ${c}`;
          const baseClasses = `aspect-square flex items-center justify-center rounded-sm border text-xs font-medium ${meta.bg} ${meta.border} ${meta.text}`;

          if (onCellClick) {
            return (
              <button
                type="button"
                key={`${r}-${c}`}
                role="gridcell"
                aria-label={label}
                onClick={() => onCellClick(r, c)}
                className={`${baseClasses} cursor-pointer transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
              >
                {meta.label}
              </button>
            );
          }

          return (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              aria-label={label}
              className={baseClasses}
            >
              {meta.label}
            </div>
          );
        }),
      )}
    </div>
  );
}
