import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { generateSeating } from "./generate";
import type { GenerationOptions } from "./types";

const defaultOptions: GenerationOptions = {
  honorDietaryAccessibilitys: true,
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
    attendeesPerGroup: null,
    grid,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

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

describe("generateSeating", () => {
  it("returns an empty result for an empty classroom", () => {
    const result = generateSeating(
      [makeAttendee({ id: "maya", name: "Maya" })],
      makeLayout([["perimeter", "door"]]),
      defaultOptions,
    );

    expect(result.assignments).toEqual({});
    expect(result.issues).toEqual([
      {
        severity: "warning",
        message: "No available seat for Maya.",
        externalIds: ["maya"],
      },
    ]);
  });

  it("places the maximum possible attendees and reports overflow", () => {
    const result = generateSeating(
      [
        makeAttendee({ id: "amy", name: "Amy" }),
        makeAttendee({ id: "maya", name: "Maya" }),
        makeAttendee({ id: "sam", name: "Sam" }),
      ],
      makeLayout([["seat", "seat"]]),
      defaultOptions,
    );

    expect(Object.values(result.assignments).toSorted()).toEqual(["amy", "maya"]);
    expect(result.issues).toEqual([
      {
        severity: "warning",
        message: "No available seat for Sam.",
        externalIds: ["sam"],
      },
    ]);
  });

  it("handles all attendees needing the same accommodation", () => {
    const result = generateSeating(
      [
        makeAttendee({
          id: "amy",
          name: "Amy",
          constraints: ["near_door"],
        }),
        makeAttendee({
          id: "maya",
          name: "Maya",
          constraints: ["near_door"],
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

  it("respects separateIds lists when possible", () => {
    const result = generateSeating(
      [
        makeAttendee({ id: "amy", name: "Amy", separateIds: ["bob"] }),
        makeAttendee({ id: "bob", name: "Bob" }),
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
        makeAttendee({
          id: "amy",
          name: "Amy",
          constraints: ["near_door"],
        }),
        makeAttendee({ id: "bob", name: "Bob" }),
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
    const attendees = [
      makeAttendee({ id: "amy", name: "Amy", togetherIds: ["bob"] }),
      makeAttendee({ id: "bob", name: "Bob" }),
      makeAttendee({ id: "maya", name: "Maya", separateIds: ["sam"] }),
      makeAttendee({ id: "sam", name: "Sam" }),
    ];
    const layout = makeLayout([
      ["seat", "seat", "seat"],
      ["seat", "seat", "seat"],
    ]);

    const first = generateSeating(attendees, layout, defaultOptions);
    const second = generateSeating(attendees, layout, defaultOptions);

    expect(second.assignments).toEqual(first.assignments);
    expect(second.score).toBe(first.score);
    expect(second.issues).toEqual(first.issues);
  });
});
