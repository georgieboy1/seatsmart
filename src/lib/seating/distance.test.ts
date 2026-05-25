import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import {
  chebyshevDistance,
  computePodMap,
  isSufficientlySeparated,
  seatsWithinRadius,
} from "./distance";

function makeLayout(
  grid: ClassroomLayout["grid"],
  type: ClassroomLayout["type"] = "traditional",
): ClassroomLayout {
  return {
    id: "l",
    userId: "u",
    name: "L",
    type,
    rows: null,
    columns: null,
    numGroups: null,
    attendeesPerGroup: null,
    grid,
    venueId: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
  };
}

describe("chebyshevDistance", () => {
  it("returns 0 for the same position", () => {
    expect(chebyshevDistance({ row: 2, column: 3 }, { row: 2, column: 3 })).toBe(0);
  });

  it("uses the max of row and column deltas", () => {
    expect(chebyshevDistance({ row: 0, column: 0 }, { row: 3, column: 1 })).toBe(3);
    expect(chebyshevDistance({ row: 0, column: 0 }, { row: 1, column: 4 })).toBe(4);
  });

  it("returns 1 for any 8-neighbor adjacency (including diagonal)", () => {
    expect(chebyshevDistance({ row: 5, column: 5 }, { row: 4, column: 4 })).toBe(1);
    expect(chebyshevDistance({ row: 5, column: 5 }, { row: 6, column: 5 })).toBe(1);
    expect(chebyshevDistance({ row: 5, column: 5 }, { row: 4, column: 6 })).toBe(1);
  });
});

describe("seatsWithinRadius", () => {
  it("returns only seat cells within the Chebyshev radius", () => {
    const layout = makeLayout([
      ["seat", "seat", "seat"],
      ["seat", "perimeter", "seat"],
      ["seat", "seat", "seat"],
    ]);
    const center = { row: 1, column: 1 };
    const within1 = seatsWithinRadius(layout, center, 1);
    // Should include 8 surrounding seats (center itself is perimeter)
    expect(within1).toHaveLength(8);
  });

  it("excludes non-seat cells", () => {
    const layout = makeLayout([
      ["perimeter", "perimeter", "perimeter"],
      ["perimeter", "seat", "perimeter"],
    ]);
    const within = seatsWithinRadius(layout, { row: 1, column: 1 }, 5);
    expect(within).toEqual([{ row: 1, column: 1 }]);
  });
});

describe("computePodMap (traditional layout)", () => {
  it("groups all seats into a single pod", () => {
    const layout = makeLayout([
      ["seat", "seat", "seat"],
      ["seat", "seat", "seat"],
    ]);
    const map = computePodMap(layout);
    const podIds = new Set(map.values());
    expect(podIds.size).toBe(1);
    expect(map.size).toBe(6);
  });

  it("treats diagonally-connected seats as the same pod (cardinal BFS)", () => {
    // Diagonals across perimeter shouldn't merge unless cardinal path exists.
    const layout = makeLayout([
      ["seat", "perimeter"],
      ["perimeter", "seat"],
    ]);
    const map = computePodMap(layout);
    // Two seats, no cardinal connection, so two pods.
    expect(new Set(map.values()).size).toBe(2);
  });
});

describe("computePodMap (groups layout)", () => {
  it("identifies each cluster as a distinct pod", () => {
    // Two pods, separated by a perimeter row.
    const layout = makeLayout(
      [
        ["perimeter", "perimeter", "perimeter", "perimeter"],
        ["perimeter", "seat", "seat", "perimeter"],
        ["perimeter", "perimeter", "perimeter", "perimeter"],
        ["perimeter", "seat", "seat", "perimeter"],
        ["perimeter", "perimeter", "perimeter", "perimeter"],
      ],
      "groups",
    );
    const map = computePodMap(layout);
    expect(new Set(map.values()).size).toBe(2);
  });
});

describe("isSufficientlySeparated", () => {
  const podMap = new Map<string, number>([
    ["0,0", 0],
    ["0,2", 1],
    ["1,0", 0],
  ]);

  it("returns true when Chebyshev distance >= minDistance", () => {
    const layout = makeLayout([["seat", "seat", "seat"]]);
    expect(
      isSufficientlySeparated(
        { row: 0, column: 0 },
        { row: 0, column: 3 },
        2,
        podMap,
        layout,
      ),
    ).toBe(true);
  });

  it("returns false when Chebyshev distance < minDistance in a traditional layout", () => {
    const layout = makeLayout([["seat", "seat"]]);
    expect(
      isSufficientlySeparated(
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        2,
        podMap,
        layout,
      ),
    ).toBe(false);
  });

  it("returns true for different pods in a Groups layout regardless of physical distance", () => {
    const layout = makeLayout(
      [["seat", "perimeter", "seat"]],
      "groups",
    );
    // Even though Chebyshev distance is 2 (passes anyway), the pod check
    // is the first signal. Make D=10 to prove pod-membership wins.
    expect(
      isSufficientlySeparated(
        { row: 0, column: 0 },
        { row: 0, column: 2 },
        10,
        podMap,
        layout,
      ),
    ).toBe(true);
  });

  it("falls back to Chebyshev for same-pod seats in a Groups layout", () => {
    const samePodMap = new Map<string, number>([
      ["0,0", 0],
      ["0,1", 0],
    ]);
    const layout = makeLayout([["seat", "seat"]], "groups");
    expect(
      isSufficientlySeparated(
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        2,
        samePodMap,
        layout,
      ),
    ).toBe(false);
  });
});
