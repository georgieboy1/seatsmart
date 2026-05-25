import type { CellType } from "@/lib/types/layout";

/**
 * Build a Traditional layout grid: `rows × columns` interior seats wrapped
 * in a perimeter of wall cells. A teacher desk sits centered on the bottom
 * perimeter as a sensible default; the user can move or remove it later.
 *
 * Resulting grid dimensions are `(rows + 2) × (columns + 2)`.
 */
export function createTraditionalGrid(
  rows: number,
  columns: number,
): CellType[][] {
  const totalRows = rows + 2;
  const totalCols = columns + 2;

  const grid: CellType[][] = [];
  for (let r = 0; r < totalRows; r++) {
    const row: CellType[] = [];
    for (let c = 0; c < totalCols; c++) {
      const isPerimeter =
        r === 0 || r === totalRows - 1 || c === 0 || c === totalCols - 1;
      row.push(isPerimeter ? "perimeter" : "seat");
    }
    grid.push(row);
  }

  // Teacher desk centered on the bottom perimeter.
  const bottomRow = totalRows - 1;
  const centerCol = Math.floor(totalCols / 2);
  grid[bottomRow][centerCol] = "teacher_desk";

  return grid;
}

/**
 * Build a Groups layout grid: `numGroups` clusters (pods) of attendees,
 * each cluster arranged in a small block (e.g. 2x2 or 3x2).
 * Clusters are separated by walking-space (perimeter cells).
 * Teacher desk centered on the top perimeter.
 */
export function createGroupsGrid(
  numGroups: number,
  attendeesPerGroup: number,
): CellType[][] {
  if (numGroups <= 0) return createTraditionalGrid(1, 1);

  // 1. Determine pod dimensions (the block size for one group)
  // Small groups (<=4) use 2-wide pods. Larger groups use 3-wide.
  const podWidth = attendeesPerGroup <= 1 ? 1 : attendeesPerGroup <= 4 ? 2 : 3;
  const podHeight = Math.ceil(attendeesPerGroup / podWidth);

  // 2. Determine how to arrange the pods in a grid
  // We want a balanced layout, so we target a square-ish grid of pods.
  const numColsPods = Math.ceil(Math.sqrt(numGroups));
  const numRowsPods = Math.ceil(numGroups / numColsPods);

  // 3. Calculate total grid size
  // Each pod has 1 perimeter cell to its right and bottom.
  // We also need 1 perimeter cell on the top and left edges.
  const totalCols = numColsPods * (podWidth + 1) + 1;
  const totalRows = numRowsPods * (podHeight + 1) + 1;

  // Initialize with perimeter
  const grid: CellType[][] = Array.from({ length: totalRows }, () =>
    Array.from({ length: totalCols }, () => "perimeter"),
  );

  // 4. Place seats for each group
  for (let i = 0; i < numGroups; i++) {
    const groupRow = Math.floor(i / numColsPods);
    const groupCol = i % numColsPods;

    const startR = groupRow * (podHeight + 1) + 1;
    const startC = groupCol * (podWidth + 1) + 1;

    let seatsPlaced = 0;
    for (let pr = 0; pr < podHeight && seatsPlaced < attendeesPerGroup; pr++) {
      for (let pc = 0; pc < podWidth && seatsPlaced < attendeesPerGroup; pc++) {
        grid[startR + pr][startC + pc] = "seat";
        seatsPlaced++;
      }
    }
  }

  // Teacher desk centered on the top perimeter.
  const centerCol = Math.floor(totalCols / 2);
  grid[0][centerCol] = "teacher_desk";

  return grid;
}

/**
 * Count cells of a given type across a grid.
 */
export function countCells(grid: CellType[][], type: CellType): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === type) count++;
    }
  }
  return count;
}
