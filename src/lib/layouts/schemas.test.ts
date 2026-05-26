import { describe, it, expect } from "vitest";
import { layoutCreateSchema } from "./schemas";
import { createTraditionalGrid, createGroupsGrid } from "./grid";

describe("layoutCreateSchema", () => {
  it("accepts a valid traditional layout", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Room 12",
      type: "traditional",
      rows: 5,
      columns: 6,
      numGroups: null,
      studentsPerGroup: null,
      grid: createTraditionalGrid(5, 6),
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid groups layout", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Pod room",
      type: "groups",
      rows: null,
      columns: null,
      numGroups: 4,
      studentsPerGroup: 4,
      grid: createGroupsGrid(4, 4),
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = layoutCreateSchema.safeParse({
      name: "",
      type: "traditional",
      rows: 5,
      columns: 5,
      numGroups: null,
      studentsPerGroup: null,
      grid: createTraditionalGrid(5, 5),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = layoutCreateSchema.safeParse({
      name: "  Spacious  ",
      type: "traditional",
      rows: 5,
      columns: 5,
      numGroups: null,
      studentsPerGroup: null,
      grid: createTraditionalGrid(5, 5),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Spacious");
  });

  it("rejects rows beyond range", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Too big",
      type: "traditional",
      rows: 11,
      columns: 5,
      numGroups: null,
      studentsPerGroup: null,
      grid: createTraditionalGrid(10, 5),
    });
    expect(result.success).toBe(false);
  });

  it("rejects numGroups beyond range", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Too many groups",
      type: "groups",
      rows: null,
      columns: null,
      numGroups: 13,
      studentsPerGroup: 4,
      grid: createGroupsGrid(12, 4),
    });
    expect(result.success).toBe(false);
  });

  it("rejects traditional with groups fields populated", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Mixed up",
      type: "traditional",
      rows: 5,
      columns: 5,
      numGroups: 4,
      studentsPerGroup: 4,
      grid: createTraditionalGrid(5, 5),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-rectangular grid", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Wobble",
      type: "traditional",
      rows: 2,
      columns: 2,
      numGroups: null,
      studentsPerGroup: null,
      grid: [
        ["perimeter", "perimeter", "perimeter"],
        ["perimeter", "seat", "perimeter", "perimeter"],
        ["perimeter", "perimeter", "perimeter"],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown cell type", () => {
    const result = layoutCreateSchema.safeParse({
      name: "Bad cells",
      type: "traditional",
      rows: 1,
      columns: 1,
      numGroups: null,
      studentsPerGroup: null,
      grid: [
        ["perimeter", "perimeter", "perimeter"],
        ["perimeter", "magic", "perimeter"],
        ["perimeter", "perimeter", "perimeter"],
      ],
    });
    expect(result.success).toBe(false);
  });
});
