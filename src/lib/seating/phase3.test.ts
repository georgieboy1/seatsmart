import { describe, expect, it } from "vitest";
import type { Attendee } from "@/lib/types/attendee";
import { optimizeSeatSwaps } from "./phase3";

function makeAttendee(overrides: Partial<Attendee> = {}): Attendee {
  return {
    id: "attendee-1",
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

describe("optimizeSeatSwaps", () => {
  it("accepts swaps that improve relationship score", () => {
    const attendees = [
      makeAttendee({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
      makeAttendee({ id: "sam", name: "Sam" }),
      makeAttendee({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      attendees,
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
        ([seatKey, externalId]) => seatKey === "1,2" && externalId === "sam",
      ),
    ).toBe(true);
  });

  it("does not accept swaps that fail to improve score", () => {
    const attendees = [
      makeAttendee({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
      makeAttendee({ id: "sam", name: "Sam" }),
    ];

    const result = optimizeSeatSwaps({
      attendees,
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
    const attendees = [
      makeAttendee({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
      makeAttendee({ id: "sam", name: "Sam" }),
      makeAttendee({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      attendees,
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
    const attendees = [
      makeAttendee({ id: "a", name: "A", togetherIds: ["b"] }),
      makeAttendee({ id: "b", name: "B" }),
      makeAttendee({ id: "c", name: "C", togetherIds: ["d"] }),
      makeAttendee({ id: "d", name: "D" }),
    ];

    const result = optimizeSeatSwaps({
      attendees,
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
    const attendees = [
      makeAttendee({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
      makeAttendee({ id: "sam", name: "Sam" }),
      makeAttendee({ id: "jordan", name: "Jordan" }),
    ];

    const result = optimizeSeatSwaps({
      attendees,
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
