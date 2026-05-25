import type { NewStudent, Student } from "@/lib/types/student";
import type {
  Accommodation,
  AntisocialTrait,
  ProsocialTrait,
} from "./constants";

export type StudentRow = {
  id: string;
  user_id: string;
  cohort_id: string | null;
  name: string;
  prosocial_traits: ProsocialTrait[];
  antisocial_traits: AntisocialTrait[];
  accommodations: Accommodation[];
  peer_tutors: string[];
  avoid: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentInsert = Omit<StudentRow, "id" | "created_at" | "updated_at">;

export function rowToStudent(row: StudentRow): Student {
  return {
    id: row.id,
    userId: row.user_id,
    cohortId: row.cohort_id,
    name: row.name,
    prosocialTraits: row.prosocial_traits,
    antisocialTraits: row.antisocial_traits,
    accommodations: row.accommodations,
    peerTutors: row.peer_tutors,
    avoid: row.avoid,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function studentToInsert(student: NewStudent, userId: string): StudentInsert {
  return {
    user_id: userId,
    cohort_id: student.cohortId ?? null,
    name: student.name,
    prosocial_traits: student.prosocialTraits,
    antisocial_traits: student.antisocialTraits,
    accommodations: student.accommodations,
    peer_tutors: student.peerTutors,
    avoid: student.avoid,
    notes: student.notes,
  };
}
