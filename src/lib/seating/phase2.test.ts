import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/types/student";
import { placeRemainingStudents } from "./phase2";

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

describe("placeRemainingStudents", () => {
  it("fills available seats with unplaced students", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "maya", name: "Maya" }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      assignments: {},
      placedStudentIds: new Set(),
      availableSeatKeys: ["1,1", "1,2"],
      explanations: {},
    });

    expect(result.assignments).toEqual({
      "1,1": "maya",
      "1,2": "sam",
    });
    expect(result.issues).toEqual([]);
  });

  it("keeps existing phase 1 assignments intact", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "maya", name: "Maya", constraints: ["near_door"] }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedStudentIds: new Set(["maya"]),
      availableSeatKeys: ["1,2"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments).toEqual({
      "1,1": "maya",
      "1,2": "sam",
    });
  });

  it("places peer tutors adjacent when possible", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedStudentIds: new Set(["maya"]),
      availableSeatKeys: ["1,2", "4,4"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments["1,2"]).toBe("sam");
    expect(result.explanations["1,2"][0].rule).toBe("together_list_adjacency");
  });

  it("separateIdss separateIds-list adjacency when another seat is available", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "maya", name: "Maya", separateIds: ["sam"] }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedStudentIds: new Set(["maya"]),
      availableSeatKeys: ["1,2", "4,4"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments["4,4"]).toBe("sam");
  });

  it("warns when there are more remaining students than seats", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "maya", name: "Maya" }),
        makeStudent({ id: "sam", name: "Sam" }),
      ],
      assignments: {},
      placedStudentIds: new Set(),
      availableSeatKeys: ["1,1"],
      explanations: {},
    });

    expect(Object.values(result.assignments)).toHaveLength(1);
    expect(result.issues).toEqual([
      {
        severity: "warning",
        message: "No available seat for Sam.",
        externalIds: ["sam"],
      },
    ]);
  });

  it("uses deterministic tie-breakers when scores are equal", () => {
    const result = placeRemainingStudents({
      students: [
        makeStudent({ id: "zoe", name: "Zoe" }),
        makeStudent({ id: "amy", name: "Amy" }),
      ],
      assignments: {},
      placedStudentIds: new Set(),
      availableSeatKeys: ["2,2", "1,1"],
      explanations: {},
    });

    expect(result.assignments).toEqual({
      "1,1": "amy",
      "2,2": "zoe",
    });
  });
});
