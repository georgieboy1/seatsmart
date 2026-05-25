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
 * Build a Groups layout grid: `numGroups` horizontal rows of seats, each
 * `studentsPerGroup` wide, separated by walking-space rows of wall cells.
 * Teacher desk centered on the top perimeter.
 *
 * Resulting grid dimensions are `(numGroups * 2 + 1) × (studentsPerGroup + 2)`.
 */
export function createGroupsGrid(
  numGroups: number,
  studentsPerGroup: number,
): CellType[][] {
  const totalCols = studentsPerGroup + 2;
  const totalRows = numGroups * 2 + 1;

  const grid: CellType[][] = [];
  for (let r = 0; r < totalRows; r++) {
    const row: CellType[] = [];
    const isSeparatorRow = r % 2 === 0;
    for (let c = 0; c < totalCols; c++) {
      const isLeftRightPerimeter = c === 0 || c === totalCols - 1;
      if (isSeparatorRow || isLeftRightPerimeter) {
        row.push("perimeter");
      } else {
        row.push("seat");
      }
    }
    grid.push(row);
  }

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
