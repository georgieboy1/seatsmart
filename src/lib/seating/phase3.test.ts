import { describe, expect, it } from "vitest";
import type { Student } from "@/lib/types/student";
import { optimizeSeatSwaps } from "./phase3";

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

describe("optimizeSeatSwaps", () => {
  it("accepts swaps that improve relationship score", () => {
    const students = [
      makeStudent({ id: "maya", name: "Maya", peerTutors: ["sam"] }),
      makeStudent({ id: "sam", name: "Sam" }),
      makeStudent({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      students,
      assignments: {
        "1,1": "maya",
        "1,2": "jordan",
        "4,4": "sam",
      },
      explanations: {},
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.swapsAccepted).toBe(1);
    expect(
      Object.entries(result.assignments).some(
        ([seatKey, studentId]) => seatKey === "1,2" && studentId === "sam",
      ),
    ).toBe(true);
  });

  it("does not accept swaps that fail to improve score", () => {
    const students = [
      makeStudent({ id: "maya", name: "Maya", peerTutors: ["sam"] }),
      makeStudent({ id: "sam", name: "Sam" }),
    ];

    const result = optimizeSeatSwaps({
      students,
      assignments: {
        "1,1": "maya",
        "1,2": "sam",
      },
      explanations: {},
    });

    expect(result.score).toBe(10);
    expect(result.swapsAccepted).toBe(0);
  });

  it("does not move locked seats", () => {
    const students = [
      makeStudent({ id: "maya", name: "Maya", peerTutors: ["sam"] }),
      makeStudent({ id: "sam", name: "Sam" }),
      makeStudent({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      students,
      assignments: {
        "1,1": "maya",
        "1,2": "jordan",
        "4,4": "sam",
      },
      explanations: {},
      lockedSeatKeys: new Set(["4,4"]),
    });

    expect(result.assignments["4,4"]).toBe("sam");
    expect(result.swapsAccepted).toBe(0);
  });

  it("stops at the max iteration cap", () => {
    const students = [
      makeStudent({ id: "a", name: "A", peerTutors: ["b"] }),
      makeStudent({ id: "b", name: "B" }),
      makeStudent({ id: "c", name: "C", peerTutors: ["d"] }),
      makeStudent({ id: "d", name: "D" }),
    ];

    const result = optimizeSeatSwaps({
      students,
      assignments: {
        "1,1": "a",
        "1,2": "c",
        "4,4": "b",
        "4,5": "d",
      },
      explanations: {},
      maxIterations: 1,
    });

    expect(result.swapsAccepted).toBeLessThanOrEqual(1);
  });

  it("recalculates relationship explanations after swaps", () => {
    const students = [
      makeStudent({ id: "maya", name: "Maya", peerTutors: ["sam"] }),
      makeStudent({ id: "sam", name: "Sam" }),
      makeStudent({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      students,
      assignments: {
        "1,1": "maya",
        "1,2": "jordan",
        "4,4": "sam",
      },
      explanations: {},
    });

    expect(
      Object.values(result.explanations).some((items) =>
        items.some((item) => item.rule === "peer_tutor_adjacency"),
      ),
    ).toBe(true);
  });
});
