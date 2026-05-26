import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { identifyAnchors, rankByTogetherCentrality } from "./anchors";

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
    studentsPerGroup: null,
    grid,
    createdAt: "x",
    updatedAt: "x",
  };
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "a",
    userId: "u",
    name: "A",
    prosocialTraits: [],
    antisocialTraits: [],
    constraints: [],
    togetherIds: [],
    separateIds: [],
    notes: null,
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  };
}

describe("identifyAnchors (traditional)", () => {
  it("returns seats adjacent to a teacher_desk", () => {
    const layout = makeLayout([
      ["perimeter", "teacher_desk", "perimeter"],
      ["seat", "seat", "seat"],
      ["seat", "seat", "seat"],
    ]);
    // Row 1 (Chebyshev=1 to teacher_desk at (0,1)) → all 3 are anchors.
    // Row 2 (Chebyshev=2) → not anchors.
    const anchors = identifyAnchors(layout);
    expect(anchors).toEqual([
      { row: 1, column: 0 },
      { row: 1, column: 1 },
      { row: 1, column: 2 },
    ]);
  });

  it("returns seats adjacent to a whiteboard", () => {
    const layout = makeLayout([
      ["perimeter", "whiteboard", "perimeter"],
      ["seat", "seat", "seat"],
    ]);
    expect(identifyAnchors(layout)).toHaveLength(3);
  });

  it("returns an empty array when no teacher_desk or whiteboard exists", () => {
    const layout = makeLayout([
      ["perimeter", "door", "perimeter"],
      ["seat", "seat", "seat"],
    ]);
    expect(identifyAnchors(layout)).toEqual([]);
  });

  it("does NOT consider seats adjacent to door/window/charging as anchors", () => {
    const layout = makeLayout([
      ["door", "window", "charging_station"],
      ["seat", "seat", "seat"],
    ]);
    expect(identifyAnchors(layout)).toEqual([]);
  });
});

describe("identifyAnchors (groups)", () => {
  it("picks one anchor per pod", () => {
    // Two separate 1-seat pods. Each pod has exactly one seat, which is
    // its own anchor (closest-to-center being trivially itself).
    const layout = makeLayout(
      [["seat", "perimeter", "seat"]],
      "groups",
    );
    const anchors = identifyAnchors(layout);
    expect(anchors).toHaveLength(2);
    expect(anchors).toContainEqual({ row: 0, column: 0 });
    expect(anchors).toContainEqual({ row: 0, column: 2 });
  });

  it("picks the pod seat closest to the geometric center", () => {
    // One 3-wide pod. Center of the 1x3 grid is column 1.
    const layout = makeLayout([["seat", "seat", "seat"]], "groups");
    const anchors = identifyAnchors(layout);
    expect(anchors).toEqual([{ row: 0, column: 1 }]);
  });
});

describe("rankByTogetherCentrality", () => {
  it("returns empty for students with zero links", () => {
    expect(
      rankByTogetherCentrality([
        makeStudent({ id: "a" }),
        makeStudent({ id: "b" }),
      ]),
    ).toEqual([]);
  });

  it("sorts by combined inbound + outbound degree, desc", () => {
    const ranked = rankByTogetherCentrality([
      makeStudent({ id: "hub", name: "Hub", togetherIds: ["a", "b", "c"] }),
      makeStudent({ id: "a", name: "Alice" }),
      makeStudent({ id: "b", name: "Bob" }),
      makeStudent({ id: "c", name: "Carol", togetherIds: ["hub"] }),
    ]);

    // Hub:   3 outbound + 1 inbound (from Carol)  = 4
    // Carol: 1 outbound + 1 inbound (from Hub)    = 2
    // Alice: 0 outbound + 1 inbound (from Hub)    = 1
    // Bob:   0 outbound + 1 inbound (from Hub)    = 1
    expect(ranked[0].student.id).toBe("hub");
    expect(ranked[0].centrality).toBe(4);
    expect(ranked[1].student.id).toBe("c"); // Carol's id literal in fixture
    expect(ranked[1].centrality).toBe(2);
    // Alice + Bob tie at 1; alphabetical breaks tie.
    expect(ranked[2].student.name).toBe("Alice");
    expect(ranked[3].student.name).toBe("Bob");
  });

  it("filters out zero-centrality students entirely", () => {
    const ranked = rankByTogetherCentrality([
      makeStudent({ id: "hub", name: "Hub", togetherIds: ["a"] }),
      makeStudent({ id: "a", name: "Alice" }),
      makeStudent({ id: "noone", name: "NoOne" }),
    ]);
    // Both Hub (1 outbound) and Alice (1 inbound) have centrality=1.
    // Tie-break is alphabetical by name: Alice < Hub.
    expect(ranked.map((r) => r.student.id)).toEqual(["a", "hub"]);
    expect(ranked.find((r) => r.student.id === "noone")).toBeUndefined();
  });
});
