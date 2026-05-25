import { describe, expect, it } from "vitest";
import { rowToStudent, studentToInsert, type StudentRow } from "./db";

const row: StudentRow = {
  id: "student-1",
  user_id: "user-1",
  name: "Maya Chen",
  prosocial_traits: ["helpful", "focused"],
  antisocial_traits: ["talkative"],
  accommodations: ["front_of_room"],
  cohort_id: null,
  peer_tutors: ["student-2"],
  avoid: ["student-3"],
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("student db mappers", () => {
  it("maps a Supabase row to a Student", () => {
    expect(rowToStudent(row)).toEqual({
      id: "student-1",
      userId: "user-1",
      name: "Maya Chen",
      prosocialTraits: ["helpful", "focused"],
      antisocialTraits: ["talkative"],
      accommodations: ["front_of_room"],
      cohortId: null,
      peerTutors: ["student-2"],
      avoid: ["student-3"],
      notes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a NewStudent to a Supabase insert shape", () => {
    expect(
      studentToInsert(
        {
          name: "Maya Chen",
          prosocialTraits: ["helpful"],
          antisocialTraits: [],
          accommodations: ["front_of_room"],
          peerTutors: [],
          avoid: ["student-3"],
          notes: "Needs a predictable routine.",
        },
        "user-1",
      ),
    ).toEqual({
      user_id: "user-1",
      name: "Maya Chen",
      prosocial_traits: ["helpful"],
      antisocial_traits: [],
      accommodations: ["front_of_room"],
      cohort_id: null,
      peer_tutors: [],
      avoid: ["student-3"],
      notes: "Needs a predictable routine.",
    });
  });

  it("preserves null notes", () => {
    expect(rowToStudent(row).notes).toBeNull();
  });
});
