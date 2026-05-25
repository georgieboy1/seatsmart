import { describe, expect, it } from "vitest";
import type { Attendee } from "@/lib/types/attendee";
import { placeRemainingAttendees } from "./phase2";

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

describe("placeRemainingAttendees", () => {
  it("fills available seats with unplaced attendees", () => {
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "maya", name: "Maya" }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      assignments: {},
      placedAttendeeIds: new Set(),
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
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "maya", name: "Maya", constraints: ["near_door"] }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedAttendeeIds: new Set(["maya"]),
      availableSeatKeys: ["1,2"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments).toEqual({
      "1,1": "maya",
      "1,2": "sam",
    });
  });

  it("places peer tutors adjacent when possible", () => {
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "maya", name: "Maya", togetherIds: ["sam"] }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedAttendeeIds: new Set(["maya"]),
      availableSeatKeys: ["1,2", "4,4"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments["1,2"]).toBe("sam");
    expect(result.explanations["1,2"][0].rule).toBe("peer_tutor_adjacency");
  });

  it("separateIdss separateIds-list adjacency when another seat is available", () => {
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "maya", name: "Maya", separateIds: ["sam"] }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      assignments: { "1,1": "maya" },
      placedAttendeeIds: new Set(["maya"]),
      availableSeatKeys: ["1,2", "4,4"],
      explanations: { "1,1": [] },
    });

    expect(result.assignments["4,4"]).toBe("sam");
  });

  it("warns when there are more remaining attendees than seats", () => {
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "maya", name: "Maya" }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      assignments: {},
      placedAttendeeIds: new Set(),
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
    const result = placeRemainingAttendees({
      attendees: [
        makeAttendee({ id: "zoe", name: "Zoe" }),
        makeAttendee({ id: "amy", name: "Amy" }),
      ],
      assignments: {},
      placedAttendeeIds: new Set(),
      availableSeatKeys: ["2,2", "1,1"],
      explanations: {},
    });

    expect(result.assignments).toEqual({
      "1,1": "amy",
      "2,2": "zoe",
    });
  });
});
