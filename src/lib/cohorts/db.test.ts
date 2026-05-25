import { describe, expect, it } from "vitest";
import { cohortToInsert, rowToCohort, type CohortRow } from "./db";

const row: CohortRow = {
  id: "cohort-1",
  user_id: "user-1",
  name: "Period 2",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("cohort db mappers", () => {
  it("maps a Supabase row to a Cohort", () => {
    expect(rowToCohort(row)).toEqual({
      id: "cohort-1",
      userId: "user-1",
      name: "Period 2",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a new cohort to a Supabase insert shape", () => {
    expect(cohortToInsert({ name: "Period 2" }, "user-1")).toEqual({
      user_id: "user-1",
      name: "Period 2",
    });
  });
});
