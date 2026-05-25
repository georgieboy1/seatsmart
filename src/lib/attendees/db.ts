import type { NewAttendee, Attendee } from "@/lib/types/attendee";
import type {
  DietaryAccessibility,
  AntisocialTrait,
  ProsocialTrait,
} from "./constants";

export type AttendeeRow = {
  id: string;
  user_id: string;
  cohort_id: string | null;
  name: string;
  external_id: string | null;
  age: number | null;
  family_name: string | null;
  allergies: string[];
  health_flags: string[];
  prosocial_traits: ProsocialTrait[];
  antisocial_traits: AntisocialTrait[];
  constraints: DietaryAccessibility[];
  together_ids: string[];
  separate_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendeeInsert = Omit<AttendeeRow, "id" | "created_at" | "updated_at">;

export function rowToAttendee(row: AttendeeRow): Attendee {
  return {
    id: row.id,
    userId: row.user_id,
    cohortId: row.cohort_id,
    name: row.name,
    externalId: row.external_id,
    age: row.age,
    familyName: row.family_name,
    allergies: row.allergies,
    healthFlags: row.health_flags,
    prosocialTraits: row.prosocial_traits,
    antisocialTraits: row.antisocial_traits,
    constraints: row.constraints,
    togetherIds: row.together_ids,
    separateIds: row.separate_ids,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function attendeeToInsert(attendee: NewAttendee, userId: string): AttendeeInsert {
  return {
    user_id: userId,
    cohort_id: attendee.cohortId ?? null,
    name: attendee.name,
    external_id: attendee.externalId ?? null,
    age: attendee.age ?? null,
    family_name: attendee.familyName ?? null,
    allergies: attendee.allergies,
    health_flags: attendee.healthFlags,
    prosocial_traits: attendee.prosocialTraits,
    antisocial_traits: attendee.antisocialTraits,
    constraints: attendee.constraints,
    together_ids: attendee.togetherIds,
    separate_ids: attendee.separateIds,
    notes: attendee.notes,
  };
}
