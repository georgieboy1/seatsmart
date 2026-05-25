import { describe, expect, it } from "vitest";
import type { ClassroomLayout } from "@/lib/types/layout";
import type { Attendee } from "@/lib/types/attendee";
import { placeDietaryAccessibilityAttendees } from "./phase1";

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

describe("placeDietaryAccessibilityAttendees", () => {
  it("places accommodated attendees in best-scoring seats", () => {
    const layout = makeLayout([
      ["perimeter", "door", "perimeter", "perimeter"],
      ["perimeter", "seat", "seat", "seat"],
      ["perimeter", "perimeter", "perimeter", "perimeter"],
    ]);
    const attendee = makeAttendee({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityAttendees([attendee], layout);

    expect(result.assignments).toEqual({ "1,1": "maya" });
    expect(result.explanations["1,1"][0].rule).toBe("near_door");
    expect(result.issues).toEqual([]);
  });

  it("leaves attendees without constraints unplaced", () => {
    const layout = makeLayout([["seat", "seat"]]);
    const attendee = makeAttendee({ id: "sam", name: "Sam" });

    const result = placeDietaryAccessibilityAttendees([attendee], layout);

    expect(result.assignments).toEqual({});
    expect(result.placedAttendeeIds.has("sam")).toBe(false);
    expect(result.availableSeatKeys).toEqual(["0,0", "0,1"]);
  });

  it("places attendees with more constraints first", () => {
    const layout = makeLayout([
      ["door", "perimeter", "perimeter"],
      ["seat", "seat", "seat"],
    ]);
    const flexible = makeAttendee({
      id: "flexible",
      name: "A Flexible",
      constraints: ["front_of_room"],
    });
    const constrained = makeAttendee({
      id: "constrained",
      name: "B Constrained",
      constraints: ["near_door", "front_of_room"],
    });

    const result = placeDietaryAccessibilityAttendees([flexible, constrained], layout);

    expect(result.assignments["1,0"]).toBe("constrained");
    expect(result.placedAttendeeIds.has("flexible")).toBe(true);
  });

  it("preserves locked seats and does not reassign those attendees", () => {
    const layout = makeLayout([
      ["door", "perimeter"],
      ["seat", "seat"],
    ]);
    const attendee = makeAttendee({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityAttendees([attendee], layout, {
      "1,1": "maya",
    });

    expect(result.assignments).toEqual({ "1,1": "maya" });
    expect(result.availableSeatKeys).toEqual(["1,0"]);
  });

  it("warns and ignores invalid locked seats", () => {
    const layout = makeLayout([["seat"]]);
    const result = placeDietaryAccessibilityAttendees([], layout, {
      "9,9": "missing",
    });

    expect(result.assignments).toEqual({});
    expect(result.issues[0]).toMatchObject({
      severity: "warning",
      externalIds: ["missing"],
    });
  });

  it("warns when no seat is available for an accommodated attendee", () => {
    const layout = makeLayout([["perimeter"]]);
    const attendee = makeAttendee({
      id: "maya",
      name: "Maya",
      constraints: ["near_door"],
    });

    const result = placeDietaryAccessibilityAttendees([attendee], layout);

    expect(result.assignments).toEqual({});
    expect(result.issues[0].message).toMatch(/no available seat/i);
  });

  it("warns when the best available seat still violates constraints", () => {
    const layout = makeLayout([["seat"]]);
    const attendee = makeAttendee({
      id: "maya",
      name: "Maya",
      constraints: ["near_charging"],
    });

    const result = placeDietaryAccessibilityAttendees([attendee], layout);

    expect(result.assignments).toEqual({ "0,0": "maya" });
    expect(result.issues[0].message).toMatch(/could not be fully satisfied/i);
  });
});
