import { describe, expect, it } from "vitest";
import { rowToStudent, studentToInsert, type StudentRow } from "./db";

const row: StudentRow = {
  id: "student-1",
  user_id: "user-1",
  name: "Maya Chen",
  external_id: "ext-1",
  age: 25,
  family_name: "Chen",
  allergies: ["peanuts"],
  health_flags: ["epipen"],
  prosocial_traits: ["helpful", "focused"],
  antisocial_traits: ["talkative"],
  constraints: ["front_of_room"],
  cohort_id: null,
  together_ids: ["student-2"],
  separate_ids: ["student-3"],
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
      externalId: "ext-1",
      age: 25,
      familyName: "Chen",
      allergies: ["peanuts"],
      healthFlags: ["epipen"],
      prosocialTraits: ["helpful", "focused"],
      antisocialTraits: ["talkative"],
      constraints: ["front_of_room"],
      classId: null,
      togetherIds: ["student-2"],
      separateIds: ["student-3"],
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
          externalId: "ext-1",
          age: 25,
          familyName: "Chen",
          allergies: ["peanuts"],
          healthFlags: ["epipen"],
          prosocialTraits: ["helpful"],
          antisocialTraits: [],
          constraints: ["front_of_room"],
          togetherIds: [],
          separateIds: ["student-3"],
          notes: "Needs a predictable routine.",
        },
        "user-1",
      ),
    ).toEqual({
      user_id: "user-1",
      name: "Maya Chen",
      external_id: "ext-1",
      age: 25,
      family_name: "Chen",
      allergies: ["peanuts"],
      health_flags: ["epipen"],
      prosocial_traits: ["helpful"],
      antisocial_traits: [],
      constraints: ["front_of_room"],
      cohort_id: null,
      together_ids: [],
      separate_ids: ["student-3"],
      notes: "Needs a predictable routine.",
    });
  });

  it("preserves null notes", () => {
    expect(rowToStudent(row).notes).toBeNull();
  });
});
