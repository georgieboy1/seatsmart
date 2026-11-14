import * as db from "@/lib/local/store";
import { go, withMessage } from "@/lib/local/nav";
import type { Class } from "@/lib/types/class";
import { classToInsert, rowToClass } from "./db";
import { classCreateSchema, classUpdateSchema } from "./schemas";

const CLASS_DELETED_STALE_REASON = "class was deleted";

export async function createClass(formData: FormData) {
  const result = classCreateSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!result.success) {
    go(withMessage("/dashboard", "error", result.error.issues[0]?.message ?? "Invalid class"));
    return;
  }
  db.insert("cohorts", [classToInsert({ name: result.data.name }, db.LOCAL_USER_ID)]);
  go(withMessage("/dashboard", "success", "Class created successfully"));
}

export async function updateClass(id: string, formData: FormData) {
  const result = classUpdateSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!result.success) {
    go(withMessage("/classes", "error", result.error.issues[0]?.message ?? "Invalid class"));
    return;
  }
  db.update("cohorts", [id], { name: result.data.name });
  go(withMessage("/classes", "success", "Class updated successfully"));
}

export async function listClasses(): Promise<Class[]> {
  return db
    .all("cohorts")
    .map(rowToClass)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/**
 * Deleting a class keeps its students (they become unassigned) and flags
 * charts generated for it as stale.
 */
export async function deleteClass(id: string) {
  const charts = db
    .all("seating_charts")
    .filter((chart) => chart.cohort_id === id)
    .map((chart) => chart.id);
  if (charts.length > 0) {
    db.update("seating_charts", charts, (chart) => ({
      stale: true,
      stale_reasons: Array.from(new Set([...chart.stale_reasons, CLASS_DELETED_STALE_REASON])),
    }));
  }
  const members = db
    .all("students")
    .filter((s) => s.cohort_id === id)
    .map((s) => s.id);
  if (members.length > 0) {
    db.update("students", members, { cohort_id: null });
  }
  db.remove("cohorts", [id]);
}
