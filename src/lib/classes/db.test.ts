import { describe, expect, it } from "vitest";
import { classToInsert, rowToClass, type ClassRow } from "./db";

const row: ClassRow = {
  id: "cohort-1",
  user_id: "user-1",
  name: "Period 2",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("class db mappers", () => {
  it("maps a Supabase row to a Class", () => {
    expect(rowToClass(row)).toEqual({
      id: "cohort-1",
      userId: "user-1",
      name: "Period 2",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a new class to a Supabase insert shape", () => {
    expect(classToInsert({ name: "Period 2" }, "user-1")).toEqual({
      user_id: "user-1",
      name: "Period 2",
    });
  });
});
