import type { NewStudent, Student } from "@/lib/types/student";
import type {
  DietaryAccessibility,
  AntisocialTrait,
  ProsocialTrait,
} from "./constants";

export type StudentRow = {
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

export type StudentInsert = Omit<StudentRow, "id" | "created_at" | "updated_at">;

export function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    userId: row.user_id,
    classId: row.cohort_id,
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

export function studentToInsert(student: NewStudent, userId: string): StudentInsert {
  return {
    user_id: userId,
    cohort_id: student.classId ?? null,
    name: student.name,
    external_id: student.externalId ?? null,
    age: student.age ?? null,
    family_name: student.familyName ?? null,
    allergies: student.allergies,
    health_flags: student.healthFlags,
    prosocial_traits: student.prosocialTraits,
    antisocial_traits: student.antisocialTraits,
    constraints: student.constraints,
    together_ids: student.togetherIds,
    separate_ids: student.separateIds,
    notes: student.notes,
  };
}
