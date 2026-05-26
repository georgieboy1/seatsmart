import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { computePodMap } from "./distance";
import {
  checkSeparation,
  countViolations,
  isSeatFeasible,
  separationConstraints,
  violatingPartners,
} from "./separation";

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

function makeLayout(grid: ClassroomLayout["grid"]): ClassroomLayout {
  return {
    id: "l",
    userId: "u",
    name: "L",
    type: "traditional",
    rows: null,
    columns: null,
    numGroups: null,
    studentsPerGroup: null,
    grid,
    createdAt: "x",
    updatedAt: "x",
  };
}

describe("separationConstraints", () => {
  it("returns empty for students with no separateIds", () => {
    expect(separationConstraints([makeStudent({ id: "x" })])).toEqual([]);
  });

  it("extracts one constraint per pair regardless of direction", () => {
    const result = separationConstraints([
      makeStudent({ id: "amy", separateIds: ["bob"] }),
      makeStudent({ id: "bob", separateIds: ["amy"] }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      studentA: "amy",
      studentB: "bob",
      minDistance: 2,
    });
  });

  it("uses the provided defaultD on every constraint", () => {
    const result = separationConstraints(
      [
        makeStudent({ id: "amy", separateIds: ["bob"] }),
        makeStudent({ id: "bob" }),
      ],
      5,
    );
    expect(result[0].minDistance).toBe(5);
  });

  it("ignores self-references", () => {
    expect(
      separationConstraints([makeStudent({ id: "x", separateIds: ["x"] })]),
    ).toEqual([]);
  });
});

describe("isSeatFeasible", () => {
  const layout = makeLayout([["seat", "seat", "seat", "seat"]]);
  const podMap = computePodMap(layout);
  const constraints = separationConstraints(
    [
      makeStudent({ id: "amy", separateIds: ["bob"] }),
      makeStudent({ id: "bob" }),
    ],
    2,
  );

  it("returns true when no constraint applies to the student", () => {
    expect(
      isSeatFeasible("0,0", "carol", {}, constraints, layout, podMap),
    ).toBe(true);
  });

  it("returns true when the conflicted partner isn't placed yet", () => {
    expect(
      isSeatFeasible("0,0", "amy", {}, constraints, layout, podMap),
    ).toBe(true);
  });

  it("returns false when placing too close to a conflicted partner", () => {
    const assignments = { "0,0": "bob" };
    expect(
      isSeatFeasible("0,1", "amy", assignments, constraints, layout, podMap),
    ).toBe(false);
  });

  it("returns true when placing at sufficient distance", () => {
    const assignments = { "0,0": "bob" };
    expect(
      isSeatFeasible("0,3", "amy", assignments, constraints, layout, podMap),
    ).toBe(true);
  });
});

describe("countViolations", () => {
  const layout = makeLayout([["seat", "seat"]]);
  const podMap = computePodMap(layout);

  it("counts every conflicted partner that's too close", () => {
    const constraints = separationConstraints([
      makeStudent({ id: "amy", separateIds: ["bob", "carol"] }),
      makeStudent({ id: "bob" }),
      makeStudent({ id: "carol" }),
    ]);
    const assignments = { "0,0": "bob" }; // carol not placed yet
    // Amy at (0,1) is adjacent to Bob → 1 violation; carol not placed → not counted.
    expect(
      countViolations("0,1", "amy", assignments, constraints, layout, podMap),
    ).toBe(1);
  });
});

describe("checkSeparation", () => {
  const layout = makeLayout([["seat", "seat"]]);
  const podMap = computePodMap(layout);

  it("returns no violations when nobody is placed", () => {
    const constraints = separationConstraints([
      makeStudent({ id: "amy", separateIds: ["bob"] }),
      makeStudent({ id: "bob" }),
    ]);
    expect(checkSeparation({}, constraints, layout, podMap)).toEqual([]);
  });

  it("reports a violation with both seat keys and actual distance", () => {
    const constraints = separationConstraints([
      makeStudent({ id: "amy", separateIds: ["bob"] }),
      makeStudent({ id: "bob" }),
    ]);
    const assignments = { "0,0": "amy", "0,1": "bob" };
    const violations = checkSeparation(assignments, constraints, layout, podMap);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      studentA: "amy",
      studentB: "bob",
      actualDistance: 1,
      minDistance: 2,
    });
  });
});

describe("violatingPartners", () => {
  const layout = makeLayout([["seat", "seat", "seat"]]);
  const podMap = computePodMap(layout);

  it("returns the placed students that conflict at the given seat", () => {
    const amy = makeStudent({
      id: "amy",
      name: "Amy",
      separateIds: ["bob"],
    });
    const bob = makeStudent({ id: "bob", name: "Bob" });
    const constraints = separationConstraints([amy, bob]);
    const byId = new Map<string, Student>([
      [amy.id, amy],
      [bob.id, bob],
    ]);
    const partners = violatingPartners(
      "0,1",
      "amy",
      { "0,0": "bob" },
      byId,
      constraints,
      layout,
      podMap,
    );
    expect(partners.map((p) => p.id)).toEqual(["bob"]);
  });
});
