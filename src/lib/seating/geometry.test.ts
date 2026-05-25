import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import {
  findFeaturePositions,
  getSeatCandidates,
  isAdjacent,
  isFrontOfRoom,
  manhattanDistance,
  parsePositionKey,
  positionKey,
} from "./geometry";

function makeLayout(grid: ClassroomLayout["grid"]): ClassroomLayout {
  return {
    id: "layout-1",
    userId: "user-1",
    name: "Room 12",
    type: "traditional",
    rows: null,
    columns: null,
    numGroups: null,
    attendeesPerGroup: null,
    grid,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("seating geometry", () => {
  it("finds only seat cells", () => {
    const layout = makeLayout([
      ["perimeter", "door", "perimeter"],
      ["window", "seat", "empty"],
      ["teacher_desk", "seat", "charging_station"],
    ]);

    expect(getSeatCandidates(layout).map((candidate) => candidate.key)).toEqual([
      "1,1",
      "2,1",
    ]);
  });

  it("round-trips position keys", () => {
    const position = { row: 4, column: 7 };
    expect(parsePositionKey(positionKey(position))).toEqual(position);
  });

  it("rejects invalid position keys", () => {
    expect(() => parsePositionKey("not-a-position")).toThrow(
      /invalid seat position key/i,
    );
  });

  it("treats orthogonal and diagonal neighbors as adjacent", () => {
    const center = { row: 2, column: 2 };

    expect(isAdjacent(center, { row: 1, column: 2 })).toBe(true);
    expect(isAdjacent(center, { row: 1, column: 1 })).toBe(true);
    expect(isAdjacent(center, { row: 2, column: 3 })).toBe(true);
    expect(isAdjacent(center, center)).toBe(false);
    expect(isAdjacent(center, { row: 2, column: 4 })).toBe(false);
  });

  it("calculates Manhattan distance", () => {
    expect(
      manhattanDistance({ row: 1, column: 2 }, { row: 4, column: 6 }),
    ).toBe(7);
  });

  it("finds feature positions by cell type", () => {
    const layout = makeLayout([
      ["perimeter", "whiteboard", "door"],
      ["seat", "seat", "empty"],
      ["window", "teacher_desk", "charging_station"],
    ]);

    expect(findFeaturePositions(layout, "door")).toEqual([
      { row: 0, column: 2 },
    ]);
    expect(findFeaturePositions(layout, "teacher_desk")).toEqual([
      { row: 2, column: 1 },
    ]);
    expect(findFeaturePositions(layout, "charging_station")).toEqual([
      { row: 2, column: 2 },
    ]);
  });

  it("returns no candidates for an empty classroom", () => {
    const layout = makeLayout([
      ["perimeter", "door"],
      ["window", "empty"],
    ]);

    expect(getSeatCandidates(layout)).toEqual([]);
  });

  it("treats lower row indexes as front of room", () => {
    expect(isFrontOfRoom({ row: 0, column: 3 })).toBe(true);
    expect(isFrontOfRoom({ row: 1, column: 3 })).toBe(true);
    expect(isFrontOfRoom({ row: 2, column: 3 })).toBe(false);
  });
});
