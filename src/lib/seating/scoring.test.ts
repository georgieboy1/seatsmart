import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import {
  scoreConstraintsFit,
  scoreRelationshipPair,
  scoreSeatingRelationships,
} from "./scoring";

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

describe("scoreConstraintsFit", () => {
  it("rewards seats near requested features", () => {
    const layout = makeLayout([
      ["perimeter", "door", "perimeter"],
      ["perimeter", "seat", "seat"],
      ["perimeter", "teacher_desk", "perimeter"],
    ]);
    const student = makeStudent({ constraints: ["near_door"] });

    const near = scoreConstraintsFit(student, layout, { row: 1, column: 1 });
    const far = scoreConstraintsFit(student, layout, { row: 2, column: 2 });

    expect(near.score).toBeGreaterThan(far.score);
    expect(near.explanations[0].rule).toBe("near_door");
  });

  it("rewards seats away from windows", () => {
    const layout = makeLayout([
      ["window", "perimeter", "perimeter", "perimeter"],
      ["seat", "seat", "seat", "seat"],
    ]);
    const student = makeStudent({ constraints: ["away_from_window"] });

    const near = scoreConstraintsFit(student, layout, { row: 1, column: 0 });
    const far = scoreConstraintsFit(student, layout, { row: 1, column: 3 });

    expect(far.score).toBeGreaterThan(near.score);
  });

  it("rewards front-of-room constraints in lower row indexes", () => {
    const layout = makeLayout([["seat"], ["seat"], ["seat"]]);
    const student = makeStudent({ constraints: ["vision_front"] });

    expect(scoreConstraintsFit(student, layout, { row: 0, column: 0 }).score)
      .toBeGreaterThan(
        scoreConstraintsFit(student, layout, { row: 2, column: 0 }).score,
      );
  });

  it("scores hearing constraints by room side", () => {
    const layout = makeLayout([["seat", "seat", "seat", "seat"]]);
    const student = makeStudent({ constraints: ["hearing_right"] });

    expect(scoreConstraintsFit(student, layout, { row: 0, column: 3 }).score)
      .toBeGreaterThan(
        scoreConstraintsFit(student, layout, { row: 0, column: 0 }).score,
      );
  });

  it("penalizes missing requested features", () => {
    const layout = makeLayout([["seat"]]);
    const student = makeStudent({ constraints: ["near_charging"] });

    const result = scoreConstraintsFit(student, layout, { row: 0, column: 0 });

    expect(result.score).toBeLessThan(0);
    expect(result.explanations[0].reason).toMatch(/no charging station/i);
  });
});

describe("scoreRelationshipPair", () => {
  it("scores adjacent peer tutors positively", () => {
    const a = makeStudent({
      id: "a",
      name: "Maya",
      togetherIds: ["b"],
    });
    const b = makeStudent({ id: "b", name: "Sam" });

    const result = scoreRelationshipPair(
      a,
      { row: 1, column: 1 },
      b,
      { row: 1, column: 2 },
    );

    expect(result.score).toBe(10);
    expect(result.explanations[0].rule).toBe("together_list_adjacency");
  });

  it("scores adjacent separateIds-list students strongly negative", () => {
    const a = makeStudent({ id: "a", name: "Maya", separateIds: ["b"] });
    const b = makeStudent({ id: "b", name: "Sam" });

    expect(
      scoreRelationshipPair(
        a,
        { row: 1, column: 1 },
        b,
        { row: 2, column: 2 },
      ).score,
    ).toBe(-50);
  });

  it("penalizes antisocial adjacency and rewards peer modeling", () => {
    const prosocial = makeStudent({
      id: "a",
      name: "Maya",
      prosocialTraits: ["helpful"],
    });
    const antisocial = makeStudent({
      id: "b",
      name: "Sam",
      antisocialTraits: ["talkative"],
    });

    expect(
      scoreRelationshipPair(
        prosocial,
        { row: 1, column: 1 },
        antisocial,
        { row: 1, column: 2 },
      ).score,
    ).toBe(3);

    expect(
      scoreRelationshipPair(
        { ...antisocial, id: "c", name: "Jordan" },
        { row: 1, column: 1 },
        antisocial,
        { row: 1, column: 2 },
      ).score,
    ).toBe(-5);
  });

  it("ignores non-adjacent pairs", () => {
    const a = makeStudent({ id: "a", togetherIds: ["b"] });
    const b = makeStudent({ id: "b" });

    expect(
      scoreRelationshipPair(
        a,
        { row: 1, column: 1 },
        b,
        { row: 1, column: 4 },
      ),
    ).toEqual({ score: 0, explanations: [] });
  });
});

describe("scoreSeatingRelationships", () => {
  it("aggregates relationship scores across assignments", () => {
    const students = [
      makeStudent({ id: "a", name: "Maya", togetherIds: ["b"] }),
      makeStudent({ id: "b", name: "Sam" }),
      makeStudent({ id: "c", name: "Jordan" }),
    ];

    const result = scoreSeatingRelationships(students, {
      "1,1": "a",
      "1,2": "b",
      "4,4": "c",
    });

    expect(result.score).toBe(10);
    expect(result.explanations).toHaveLength(1);
  });
});
