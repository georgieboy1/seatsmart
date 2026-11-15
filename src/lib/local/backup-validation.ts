import { z } from "zod";
import { PROSOCIAL_TRAITS, ANTISOCIAL_TRAITS, DIETARY_ACCESSIBILITY } from "@/lib/students/constants";
import type { Tables } from "./store";
const id = z.string().uuid();
const text = z.string();
const strings = z.array(text);
const base = { id, user_id: text, name: text, created_at: z.string().datetime(), updated_at: z.string().datetime() };
const student = z.object({ ...base, cohort_id: id.nullable(), external_id: text.nullable(), age: z.number().finite().nullable(), family_name: text.nullable(), allergies: strings, health_flags: strings,
  prosocial_traits: z.array(z.enum(PROSOCIAL_TRAITS.map(item => item.value))),
  antisocial_traits: z.array(z.enum(ANTISOCIAL_TRAITS.map(item => item.value))),
  constraints: z.array(z.enum(DIETARY_ACCESSIBILITY.map(item => item.value))),
  together_ids: z.array(id), separate_ids: z.array(id), notes: text.nullable(),
}).strict();
const dimension = z.number().int().nonnegative().nullable();
const layout = z.object({ ...base, front_wall: z.enum(["top", "right", "bottom", "left"]).nullable().optional(), type: z.enum(["traditional", "groups"]), rows: dimension, columns: dimension, num_groups: dimension, students_per_group: dimension,
  grid: z.array(z.array(z.enum(["door", "window", "teacher_desk", "whiteboard", "charging_station", "perimeter", "seat", "empty"]))),
}).strict();
const positions = z.record(z.string().regex(/^\d+,\d+$/), id);
const chart = z.object({ ...base, layout_id: id, cohort_id: id.nullable(), assignments: positions, locked_seats: positions, score: z.number().finite().nullable(), seed: z.number().finite(), stale: z.boolean(), stale_reasons: strings }).strict();
const dataSchema = z.object({ students: z.array(student), cohorts: z.array(z.object(base).strict()), layouts: z.array(layout), seating_charts: z.array(chart) }).strict();
/** Pure validation: never touches storage or normalizes missing data to empty tables. */
export function validateBackupData(raw: unknown): Tables {
  const result = dataSchema.safeParse(raw);
  if (!result.success) {
    const path = result.error.issues[0]?.path.join(".") || "data";
    throw new Error(`This backup has invalid or missing data (${path}). Nothing was restored.`);
  }
  const data = result.data;
  const ids = (rows: { id: string }[]) => {
    const set = new Set(rows.map(row => row.id));
    if (set.size !== rows.length) throw new Error("This backup contains duplicate IDs. Nothing was restored.");
    return set;
  };
  const students = ids(data.students), cohorts = ids(data.cohorts), layouts = ids(data.layouts);
  ids(data.seating_charts);
  const requireRef = (value: string | null, available: Set<string>) => {
    if (value !== null && !available.has(value)) throw new Error("This backup contains a missing reference. Nothing was restored.");
  };
  for (const row of data.students) {
    requireRef(row.cohort_id, cohorts);
    for (const ref of [...row.together_ids, ...row.separate_ids]) requireRef(ref, students);
  }
  for (const row of data.seating_charts) {
    requireRef(row.layout_id, layouts); requireRef(row.cohort_id, cohorts);
    for (const map of [row.assignments, row.locked_seats]) {
      const assigned = Object.values(map);
      for (const ref of assigned) requireRef(ref, students);
      if (new Set(assigned).size !== assigned.length) throw new Error("This backup assigns a student more than once. Nothing was restored.");
    }
  }
  return data;
}
