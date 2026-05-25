import { describe, expect, it } from "vitest";
import { rowToAttendee, attendeeToInsert, type AttendeeRow } from "./db";

const row: AttendeeRow = {
  id: "attendee-1",
  user_id: "user-1",
  name: "Maya Chen",
  prosocial_traits: ["helpful", "focused"],
  antisocial_traits: ["talkative"],
  constraints: ["front_of_room"],
  cohort_id: null,
  together_ids: ["attendee-2"],
  separateIds: ["attendee-3"],
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("attendee db mappers", () => {
  it("maps a Supabase row to a Attendee", () => {
    expect(rowToAttendee(row)).toEqual({
      id: "attendee-1",
      userId: "user-1",
      name: "Maya Chen",
      prosocialTraits: ["helpful", "focused"],
      antisocialTraits: ["talkative"],
      constraints: ["front_of_room"],
      cohortId: null,
      togetherIds: ["attendee-2"],
      separateIds: ["attendee-3"],
      notes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a NewAttendee to a Supabase insert shape", () => {
    expect(
      attendeeToInsert(
        {
          name: "Maya Chen",
          prosocialTraits: ["helpful"],
          antisocialTraits: [],
          constraints: ["front_of_room"],
          togetherIds: [],
          separateIds: ["attendee-3"],
          notes: "Needs a predictable routine.",
        },
        "user-1",
      ),
    ).toEqual({
      user_id: "user-1",
      name: "Maya Chen",
      prosocial_traits: ["helpful"],
      antisocial_traits: [],
      constraints: ["front_of_room"],
      cohort_id: null,
      together_ids: [],
      separateIds: ["attendee-3"],
      notes: "Needs a predictable routine.",
    });
  });

  it("preserves null notes", () => {
    expect(rowToAttendee(row).notes).toBeNull();
  });
});
