import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Student } from "@/lib/types/student";
import { generateSeating } from "./generate";
import type { GenerationOptions } from "./types";

const defaultOptions: GenerationOptions = {
  honorAccommodations: true,
  respectPeerTutors: true,
  respectAvoidList: true,
  spreadAntisocialTraits: true,
  lockedSeats: {},
  seed: 123,
};

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
    accommodations: [],
    peerTutors: [],
    avoid: [],
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("generateSeating", () => {
  it("returns an empty result for an empty classroom", () => {
    const result = generateSeating(
      [makeStudent({ id: "maya", name: "Maya" })],
      makeLayout([["perimeter", "door"]]),
      defaultOptions,
    );

    expect(result.assignments).toEqual({});
    expect(result.issues).toEqual([
      {
        severity: "warning",
        message: "No available seat for Maya.",
        studentIds: ["maya"],
      },
    ]);
  });

  it("places the maximum possible students and reports overflow", () => {
    const result = generateSeating(
      [
        makeStudent({ id: "amy", name: "Amy" }),
        makeStudent({ id: "maya", name: "Maya" }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      makeLayout([["seat", "seat"]]),
      defaultOptions,
    );

    expect(Object.values(result.assignments).toSorted()).toEqual(["amy", "maya"]);
    expect(result.issues).toEqual([
      {
        severity: "warning",
        message: "No available seat for Sam.",
        studentIds: ["sam"],
      },
    ]);
  });

  it("handles all students needing the same accommodation", () => {
    const result = generateSeating(
      [
        makeStudent({
          id: "amy",
          name: "Amy",
          accommodations: ["near_door"],
        }),
        makeStudent({
          id: "maya",
          name: "Maya",
          accommodations: ["near_door"],
        }),
      ],
      makeLayout([
        ["perimeter", "door", "perimeter"],
        ["seat", "seat", "seat"],
      ]),
      defaultOptions,
    );

    expect(Object.values(result.assignments).toSorted()).toEqual(["amy", "maya"]);
    expect(result.score).toBeGreaterThan(0);
  });

  it("respects avoid lists when possible", () => {
    const result = generateSeating(
      [
        makeStudent({ id: "amy", name: "Amy", avoid: ["bob"] }),
        makeStudent({ id: "bob", name: "Bob" }),
      ],
      makeLayout([["seat", "seat", "empty", "seat"]]),
      defaultOptions,
    );

    expect(result.assignments).toEqual({
      "0,0": "amy",
      "0,3": "bob",
    });
    expect(result.issues).toEqual([]);
  });

  it("never reassigns locked seats", () => {
    const result = generateSeating(
      [
        makeStudent({
          id: "amy",
          name: "Amy",
          accommodations: ["near_door"],
        }),
        makeStudent({ id: "bob", name: "Bob" }),
      ],
      makeLayout([
        ["perimeter", "door"],
        ["seat", "seat"],
      ]),
      {
        ...defaultOptions,
        lockedSeats: { "1,1": "bob" },
      },
    );

    expect(result.assignments["1,1"]).toBe("bob");
    expect(Object.values(result.assignments)).toContain("amy");
  });

  it("is deterministic for the same inputs and seed", () => {
    const students = [
      makeStudent({ id: "amy", name: "Amy", peerTutors: ["bob"] }),
      makeStudent({ id: "bob", name: "Bob" }),
      makeStudent({ id: "maya", name: "Maya", avoid: ["sam"] }),
      makeStudent({ id: "sam", name: "Sam" }),
    ];
    const layout = makeLayout([
      ["seat", "seat", "seat"],
      ["seat", "seat", "seat"],
    ]);

    const first = generateSeating(students, layout, defaultOptions);
    const second = generateSeating(students, layout, defaultOptions);

    expect(second.assignments).toEqual(first.assignments);
    expect(second.score).toBe(first.score);
    expect(second.issues).toEqual(first.issues);
  });
});
