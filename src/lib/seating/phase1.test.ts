import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { placeDietaryAccessibilityStudents } from "./phase1";

function makeLayout(grid: ClassroomLayout["grid"]): ClassroomLayout {
  return {
    id: "layout-1",
    userId: "user-1",
    name: "Room 12",
    type: "traditional",
    rows: null,
    columns: null,
    numGroups: null,
    studentsPerGroup: null,
    grid,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: "student-1",
    userId: "user-1",
    name: "Maya Chen",
    prosocialTraits: [],
    antisocialTraits: [],
    constraints: [],
    togetherIds: [],
    separateIds: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("placeDietaryAccessibilityStudents", () => {
  it("places accommodated students in best-scoring seats", () => {
    const layout = makeLayout([
      ["perimeter", "door", "perimeter", "perimeter"],
      ["perimeter", "seat", "seat", "seat"],
      ["perimeter", "perimeter", "perimeter", "perimeter"],
    ]);
    const student = makeStudent({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityStudents([student], layout);

    expect(result.assignments).toEqual({ "1,1": "maya" });
    expect(result.explanations["1,1"][0].rule).toBe("near_door");
    expect(result.issues).toEqual([]);
  });

  it("leaves students without constraints unplaced", () => {
    const layout = makeLayout([["seat", "seat"]]);
    const student = makeStudent({ id: "sam", name: "Sam" });

    const result = placeDietaryAccessibilityStudents([student], layout);

    expect(result.assignments).toEqual({});
    expect(result.placedStudentIds.has("sam")).toBe(false);
    expect(result.availableSeatKeys).toEqual(["0,0", "0,1"]);
  });

  it("places students with more constraints first", () => {
    const layout = makeLayout([
      ["door", "perimeter", "perimeter"],
      ["seat", "seat", "seat"],
    ]);
    const flexible = makeStudent({
      id: "flexible",
      name: "A Flexible",
      constraints: ["front_of_room"],
    });
    const constrained = makeStudent({
      id: "constrained",
      name: "B Constrained",
      constraints: ["near_door", "front_of_room"],
    });

    const result = placeDietaryAccessibilityStudents([flexible, constrained], layout);

    expect(result.assignments["1,0"]).toBe("constrained");
    expect(result.placedStudentIds.has("flexible")).toBe(true);
  });

  it("preserves locked seats and does not reassign those students", () => {
    const layout = makeLayout([
      ["door", "perimeter"],
      ["seat", "seat"],
    ]);
    const student = makeStudent({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityStudents([student], layout, {
      "1,1": "maya",
    });

    expect(result.assignments).toEqual({ "1,1": "maya" });
    expect(result.availableSeatKeys).toEqual(["1,0"]);
  });

  it("warns and ignores invalid locked seats", () => {
    const layout = makeLayout([["seat"]]);
    const result = placeDietaryAccessibilityStudents([], layout, {
      "9,9": "missing",
    });

    expect(result.assignments).toEqual({});
    expect(result.issues[0]).toMatchObject({
      severity: "warning",
      externalIds: ["missing"],
    });
  });

  it("warns when no seat is available for an accommodated student", () => {
    const layout = makeLayout([["perimeter"]]);
    const student = makeStudent({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityStudents([student], layout);

    expect(result.assignments).toEqual({});
    expect(result.issues[0].message).toMatch(/no available seat/i);
  });

  it("warns when the best available seat still violates constraints", () => {
    const layout = makeLayout([["seat"]]);
    const student = makeStudent({
      id: "maya",
      name: "Maya",
      constraints: ["near_charging"],
    });

    const result = placeDietaryAccessibilityStudents([student], layout);

    expect(result.assignments).toEqual({ "0,0": "maya" });
    expect(result.issues[0].message).toMatch(/could not be fully satisfied/i);
  });
});
