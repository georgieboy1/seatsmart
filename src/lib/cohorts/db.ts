import type { Cohort, NewCohort } from "@/lib/types/cohort";

export type CohortRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CohortInsert = Omit<CohortRow, "id" | "created_at" | "updated_at">;

export function rowToCohort(row: CohortRow): Cohort {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function cohortToInsert(cohort: NewCohort, userId: string): CohortInsert {
  return {
    user_id: userId,
    name: cohort.name,
  };
}
