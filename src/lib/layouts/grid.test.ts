import { describe, it, expect } from "vitest";
import {
  createTraditionalGrid,
  createGroupsGrid,
  countCells,
} from "./grid";

describe("createTraditionalGrid", () => {
  it("returns a grid of dimensions (rows + 2) × (columns + 2)", () => {
    const grid = createTraditionalGrid(4, 6);
    expect(grid.length).toBe(6);
    expect(grid[0].length).toBe(8);
  });

  it("places exactly rows × columns interior seats", () => {
    const grid = createTraditionalGrid(4, 6);
    expect(countCells(grid, "seat")).toBe(4 * 6);
  });

  it("places exactly one teacher desk on the bottom perimeter", () => {
    const grid = createTraditionalGrid(4, 6);
    expect(countCells(grid, "teacher_desk")).toBe(1);
    const bottomRow = grid[grid.length - 1];
    expect(bottomRow.some((cell) => cell === "teacher_desk")).toBe(true);
  });

  it("makes all non-desk perimeter cells walls", () => {
    const grid = createTraditionalGrid(4, 6);
    const totalRows = grid.length;
    const totalCols = grid[0].length;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const onPerimeter =
          r === 0 || r === totalRows - 1 || c === 0 || c === totalCols - 1;
        if (onPerimeter && grid[r][c] !== "teacher_desk") {
          expect(grid[r][c]).toBe("perimeter");
        }
      }
    }
  });

  it("handles the smallest valid layout (1 × 1)", () => {
    const grid = createTraditionalGrid(1, 1);
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(3);
    expect(grid[1][1]).toBe("seat");
    expect(countCells(grid, "seat")).toBe(1);
  });

  it("handles the largest typical layout (10 × 10)", () => {
    const grid = createTraditionalGrid(10, 10);
    expect(grid.length).toBe(12);
    expect(grid[0].length).toBe(12);
    expect(countCells(grid, "seat")).toBe(100);
  });
});

describe("createGroupsGrid", () => {
  it("returns a grid with balanced pod clustering", () => {
    // 4 groups of 4 attendees
    // podWidth = 2, podHeight = 2
    // numColsPods = 2, numRowsPods = 2
    // totalCols = 2 * (2 + 1) + 1 = 7
    // totalRows = 2 * (2 + 1) + 1 = 7
    const grid = createGroupsGrid(4, 4);
    expect(grid.length).toBe(7);
    expect(grid[0].length).toBe(7);
  });

  it("places exactly numGroups × attendeesPerGroup seats", () => {
    const grid = createGroupsGrid(6, 4);
    expect(countCells(grid, "seat")).toBe(6 * 4);
  });

  it("places exactly one teacher desk on the top perimeter", () => {
    const grid = createGroupsGrid(4, 4);
    expect(countCells(grid, "teacher_desk")).toBe(1);
    expect(grid[0].some((cell) => cell === "teacher_desk")).toBe(true);
  });

  it("ensures walking space between pods", () => {
    const grid = createGroupsGrid(4, 4);
    // In a 2x2 pod layout of 4 pods, the middle row (index 3) and column (index 3)
    // should be entirely perimeter/walking space.
    for (let c = 0; c < grid[0].length; c++) {
      expect(grid[3][c]).toBe("perimeter");
    }
    for (let r = 0; r < grid.length; r++) {
      if (grid[r][3] !== "teacher_desk") {
        expect(grid[r][3]).toBe("perimeter");
      }
    }
  });

  it("handles the smallest valid layout (1 group, 1 attendee)", () => {
    const grid = createGroupsGrid(1, 1);
    // podWidth=1, podHeight=1, numColsPods=1, numRowsPods=1
    // totalCols = 1*(1+1)+1 = 3
    // totalRows = 1*(1+1)+1 = 3
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(3);
    expect(grid[1][1]).toBe("seat");
  });

  it("handles larger group sizes with 3-wide pods", () => {
    const grid = createGroupsGrid(2, 6);
    // attendeesPerGroup = 6 -> podWidth = 3, podHeight = 2
    // numGroups = 2 -> numColsPods = 2, numRowsPods = 1
    // totalCols = 2 * (3 + 1) + 1 = 9
    // totalRows = 1 * (2 + 1) + 1 = 4
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(9);
    expect(countCells(grid, "seat")).toBe(12);
  });
});

describe("countCells", () => {
  it("counts cells of the given type across the grid", () => {
    const grid: ReturnType<typeof createTraditionalGrid> = [
      ["seat", "seat", "perimeter"],
      ["seat", "empty", "perimeter"],
    ];
    expect(countCells(grid, "seat")).toBe(3);
    expect(countCells(grid, "perimeter")).toBe(2);
    expect(countCells(grid, "empty")).toBe(1);
    expect(countCells(grid, "door")).toBe(0);
  });
});
