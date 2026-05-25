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
  it("returns a grid of dimensions (numGroups * 2 + 1) × (studentsPerGroup + 2)", () => {
    const grid = createGroupsGrid(4, 4);
    expect(grid.length).toBe(9);
    expect(grid[0].length).toBe(6);
  });

  it("places exactly numGroups × studentsPerGroup seats", () => {
    const grid = createGroupsGrid(4, 4);
    expect(countCells(grid, "seat")).toBe(4 * 4);
  });

  it("places exactly one teacher desk on the top perimeter", () => {
    const grid = createGroupsGrid(4, 4);
    expect(countCells(grid, "teacher_desk")).toBe(1);
    expect(grid[0].some((cell) => cell === "teacher_desk")).toBe(true);
  });

  it("places walls in every separator row", () => {
    const grid = createGroupsGrid(3, 4);
    // Separator rows are at even indices (0, 2, 4, 6).
    for (const r of [0, 2, 4, 6]) {
      for (const cell of grid[r]) {
        expect(cell === "perimeter" || cell === "teacher_desk").toBe(true);
      }
    }
  });

  it("handles the smallest valid layout (1 group, 1 student)", () => {
    const grid = createGroupsGrid(1, 1);
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(3);
    expect(grid[1][1]).toBe("seat");
  });

  it("handles the largest typical layout (12 groups, 8 students)", () => {
    const grid = createGroupsGrid(12, 8);
    expect(grid.length).toBe(25);
    expect(grid[0].length).toBe(10);
    expect(countCells(grid, "seat")).toBe(96);
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
