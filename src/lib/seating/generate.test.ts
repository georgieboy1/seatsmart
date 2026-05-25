import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { generateSeating } from "./generate";
import type { GenerationOptions } from "./types";

const defaultOptions: GenerationOptions = {
  honorDietaryAccessibility: true,
  respectMustSitTogether: true,
  respectStrictlySeparate: true,
  spreadAntisocialTraits: true,
  lockedSeats: {},
  seed: 123,
  minDistance: 2,
};

function makeLayout(
  grid: ClassroomLayout["grid"],
  overrides: Partial<ClassroomLayout> = {},
): ClassroomLayout {
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
    venueId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
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

  // ===== Phase 0 / Marketplace upgrade tests =====

  it("binds the highest-centrality attendee to an anchor seat", () => {
    // Layout with a teacher_desk in row 0; seats below.
    // Seats (1,0), (1,1), (1,2) are anchors (Chebyshev=1 to teacher_desk).
    const layout = makeLayout([
      ["perimeter", "teacher_desk", "perimeter"],
      ["seat", "seat", "seat"],
      ["seat", "seat", "seat"],
    ]);

    // Hub has 2 outbound + 0 inbound = centrality 2. Others: 1 inbound, 0 outbound.
    const result = generateSeating(
      [
        makeAttendee({ id: "hub", name: "Hub", togetherIds: ["a", "b"] }),
        makeAttendee({ id: "a", name: "Alice" }),
        makeAttendee({ id: "b", name: "Bob" }),
      ],
      layout,
      defaultOptions,
    );

    // Hub should land on row 1 (the anchor row).
    const hubSeat = Object.entries(result.assignments).find(
      ([, id]) => id === "hub",
    )?.[0];
    expect(hubSeat).toBeDefined();
    const [hubRow] = hubSeat!.split(",").map(Number);
    expect(hubRow).toBe(1);

    // Phase 0 should have bound at least one anchor.
    expect(result.debug.anchorsBound).toBeGreaterThan(0);

    // The anchor placement should carry an "anchor_proximity" explanation.
    const hubExplanations = result.explanationsBySeat[hubSeat!] ?? [];
    expect(
      hubExplanations.some((e) => e.rule === "anchor_proximity"),
    ).toBe(true);
  });

  it("keeps strictly-separate attendees at minimum distance when the room is large enough", () => {
    // 1x7 row of seats. With D=2 (default), Amy and Bob must be at least 2 apart.
    const result = generateSeating(
      [
        makeAttendee({ id: "amy", name: "Amy", separateIds: ["bob"] }),
        makeAttendee({ id: "bob", name: "Bob" }),
      ],
      makeLayout([["seat", "seat", "seat", "seat", "seat", "seat", "seat"]]),
      defaultOptions,
    );

    const amySeat = Object.entries(result.assignments).find(
      ([, id]) => id === "amy",
    )?.[0];
    const bobSeat = Object.entries(result.assignments).find(
      ([, id]) => id === "bob",
    )?.[0];
    expect(amySeat).toBeDefined();
    expect(bobSeat).toBeDefined();

    const [, amyCol] = amySeat!.split(",").map(Number);
    const [, bobCol] = bobSeat!.split(",").map(Number);
    expect(Math.abs(amyCol - bobCol)).toBeGreaterThanOrEqual(2);

    // No min_distance_violated issue should fire when feasible.
    expect(
      result.issues.some((i) =>
        /must be ≥\d+ seats apart/.test(i.message),
      ),
    ).toBe(false);
  });

  it("emits a severe issue and min_distance_violated explanation when the room is too small", () => {
    // 1x2 — only seats (0,0) and (0,1). Chebyshev distance is 1, D=2 is infeasible.
    const result = generateSeating(
      [
        makeAttendee({ id: "amy", name: "Amy", separateIds: ["bob"] }),
        makeAttendee({ id: "bob", name: "Bob" }),
      ],
      makeLayout([["seat", "seat"]]),
      defaultOptions,
    );

    // Both should still be placed (best-effort).
    expect(Object.values(result.assignments).toSorted()).toEqual(["amy", "bob"]);

    // A severe error issue should fire.
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((i) => /must be ≥\d+ seats apart/.test(i.message))).toBe(
      true,
    );

    // A min_distance_violated explanation must appear on at least one seat.
    const allExplanations = Object.values(result.explanationsBySeat).flat();
    expect(
      allExplanations.some((e) => e.rule === "min_distance_violated"),
    ).toBe(true);
  });

  it("surfaces the new explanation rule literals in explanationsBySeat", () => {
    const layout = makeLayout([
      ["perimeter", "teacher_desk", "perimeter"],
      ["seat", "seat", "seat"],
    ]);
    const result = generateSeating(
      [
        makeAttendee({ id: "hub", name: "Hub", togetherIds: ["a"] }),
        makeAttendee({ id: "a", name: "Alice" }),
        makeAttendee({ id: "amy", name: "Amy", separateIds: ["bob"] }),
        makeAttendee({ id: "bob", name: "Bob" }),
      ],
      layout,
      defaultOptions,
    );

    const allRules = new Set(
      Object.values(result.explanationsBySeat)
        .flat()
        .map((e) => e.rule),
    );

    // anchor_proximity should appear (Hub is high-centrality, anchor exists).
    expect(allRules.has("anchor_proximity")).toBe(true);

    // explanationsBySeat is a map, never null.
    expect(typeof result.explanationsBySeat).toBe("object");
  });

  it("treats different pods as satisfying separation in a Groups layout", () => {
    // Two pods, each a single seat, separated by a perimeter cell.
    // The Chebyshev distance is only 2 (would barely satisfy D=2 anyway),
    // but more importantly: different pod = automatic satisfaction.
    const layout = makeLayout(
      [
        ["seat", "perimeter", "seat"],
      ],
      { type: "groups" },
    );

    const result = generateSeating(
      [
        makeAttendee({ id: "amy", name: "Amy", separateIds: ["bob"] }),
        makeAttendee({ id: "bob", name: "Bob" }),
      ],
      layout,
      defaultOptions,
    );

    // Both placed.
    expect(Object.values(result.assignments).toSorted()).toEqual(["amy", "bob"]);
    // No min-distance issue because they're in different pods.
    expect(
      result.issues.some((i) => /must be ≥\d+ seats apart/.test(i.message)),
    ).toBe(false);
  });
});
