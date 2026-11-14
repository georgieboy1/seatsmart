import * as db from "@/lib/local/store";
import { go, withMessage } from "@/lib/local/nav";
import type { Student } from "@/lib/types/student";
import { rowToStudent, studentToInsert } from "./db";
import { studentCreateSchema, studentUpdateSchema } from "./schemas";

const STUDENT_REMOVED = "student was removed";

function formArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    classId: formData.get("classId") ? String(formData.get("classId")) : null,
    externalId: formData.get("externalId") ? String(formData.get("externalId")) : null,
    age: formData.get("age") ? Number(formData.get("age")) : null,
    familyName: formData.get("familyName") ? String(formData.get("familyName")) : null,
    allergies: formArray(formData, "allergies"),
    healthFlags: formArray(formData, "healthFlags"),
    prosocialTraits: formArray(formData, "prosocialTraits"),
    antisocialTraits: formArray(formData, "antisocialTraits"),
    constraints: formArray(formData, "constraints"),
    togetherIds: formArray(formData, "togetherIds"),
    separateIds: formArray(formData, "separateIds"),
    notes: String(formData.get("notes") ?? ""),
  };
}

/** Charts keep their assignments; a removed student's seat just shows empty. */
function markChartsUsingStudents(ids: string[]) {
  const affected = db
    .all("seating_charts")
    .filter((chart) => Object.values(chart.assignments).some((sid) => ids.includes(sid)))
    .map((chart) => chart.id);
  if (affected.length === 0) return;
  db.update("seating_charts", affected, (chart) => ({
    stale: true,
    stale_reasons: Array.from(new Set([...chart.stale_reasons, STUDENT_REMOVED])),
  }));
}

/** Returns true when the student was saved, false when validation failed. */
export async function createStudent(formData: FormData): Promise<boolean> {
  const result = studentCreateSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    go(withMessage("/students", "error", result.error.issues[0]?.message ?? "Invalid student"));
    return false;
  }
  db.insert("students", [studentToInsert(result.data, db.LOCAL_USER_ID)]);
  go("/students");
  return true;
}

/** Returns true when the students were imported. */
export async function importStudentsCsv(formData: FormData): Promise<boolean> {
  const json = formData.get("json");
  if (!json || typeof json !== "string") {
    go(withMessage("/students", "error", "No data received from import wizard"));
    return false;
  }

  let rawStudents: unknown;
  try {
    rawStudents = JSON.parse(json);
  } catch {
    go(withMessage("/students", "error", "Invalid import payload"));
    return false;
  }

  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    go(withMessage("/students", "error", "No students found in import payload"));
    return false;
  }

  const validated = [];
  for (const raw of rawStudents) {
    const result = studentCreateSchema.safeParse(raw);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid student data";
      const name = (raw as { name?: string })?.name || "Unknown";
      go(withMessage("/students", "error", `Row "${name}": ${message}`));
      return false;
    }
    validated.push(result.data);
  }

  db.insert(
    "students",
    validated.map((student) => studentToInsert(student, db.LOCAL_USER_ID)),
  );
  go(
    withMessage(
      "/students",
      "success",
      `Imported ${validated.length} student${validated.length === 1 ? "" : "s"}`,
    ),
  );
  return true;
}

export async function listStudents(classId?: string): Promise<Student[]> {
  return db
    .all("students")
    .filter((row) => !classId || row.cohort_id === classId)
    .map(rowToStudent)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function getStudent(id: string): Promise<Student | null> {
  const row = db.find("students", id);
  return row ? rowToStudent(row) : null;
}

/** Returns true when the student was saved, false when validation failed. */
export async function updateStudent(id: string, formData: FormData): Promise<boolean> {
  const result = studentUpdateSchema.safeParse(parseFormData(formData));
  if (!result.success) {
    go(withMessage("/students", "error", result.error.issues[0]?.message ?? "Invalid student"));
    return false;
  }
  const s = result.data;
  db.update("students", [id], {
    name: s.name,
    cohort_id: s.classId ?? null,
    external_id: s.externalId ?? null,
    age: s.age ?? null,
    family_name: s.familyName ?? null,
    allergies: s.allergies,
    health_flags: s.healthFlags,
    prosocial_traits: s.prosocialTraits,
    antisocial_traits: s.antisocialTraits,
    constraints: s.constraints,
    together_ids: s.togetherIds,
    separate_ids: s.separateIds,
    notes: s.notes,
  });
  return true;
}

export async function assignStudentsToClass(studentIds: string[], classId: string | null) {
  db.update("students", studentIds, { cohort_id: classId });
}

export async function deleteStudent(id: string) {
  await deleteStudents([id]);
  go("/students");
}

/**
 * Bulk-delete. Any chart that seats one of these students is flagged stale
 * ("student was removed") but keeps its assignments, so the seat renders
 * empty until the teacher regenerates.
 */
export async function deleteStudents(ids: string[]) {
  if (ids.length === 0) return;
  markChartsUsingStudents(ids);
  db.remove("students", ids);
  // Drop dangling peer-support / avoid-pairing references to the removed students.
  const removed = new Set(ids);
  const referencing = db
    .all("students")
    .filter((s) => s.together_ids.some((x) => removed.has(x)) || s.separate_ids.some((x) => removed.has(x)))
    .map((s) => s.id);
  if (referencing.length > 0) {
    db.update("students", referencing, (s) => ({
      together_ids: s.together_ids.filter((x) => !removed.has(x)),
      separate_ids: s.separate_ids.filter((x) => !removed.has(x)),
    }));
  }
}
