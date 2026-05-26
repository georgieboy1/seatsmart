"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types/student";
import { rowToStudent, studentToInsert, type StudentRow } from "./db";
import { studentCreateSchema, studentUpdateSchema } from "./schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

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

export async function createStudent(formData: FormData) {
  const result = studentCreateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid student";
    redirect(`/students?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("students")
    .insert(studentToInsert(result.data, userId));

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect("/students");
}

export async function importStudentsCsv(formData: FormData) {
  const json = formData.get("json");

  if (!json || typeof json !== "string") {
    redirect("/students?error=No+data+received+from+import+wizard");
  }

  let rawStudents;
  try {
    rawStudents = JSON.parse(json);
  } catch {
    redirect("/students?error=Invalid+import+payload");
  }

  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    redirect("/students?error=No+students+found+in+import+payload");
  }

  // Validate each student
  const validatedStudents = [];
  for (const raw of rawStudents) {
    const result = studentCreateSchema.safeParse(raw);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid student data";
      redirect(`/students?error=${encodeURIComponent(`Row "${raw.name || "Unknown"}": ${message}`)}`);
    }
    validatedStudents.push(result.data);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("students")
    .insert(validatedStudents.map((student) => studentToInsert(student, userId)));

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect(
    `/students?success=${encodeURIComponent(
      `Imported ${validatedStudents.length} student${validatedStudents.length === 1 ? "" : "s"}`,
    )}`,
  );
}

export async function listStudents(classId?: string): Promise<Student[]> {
  const { supabase, userId } = await requireUser();

  let query = supabase
    .from("students")
    .select("*")
    .eq("user_id", userId);

  if (classId) {
    query = query.eq("cohort_id", classId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load students: ${error.message}`);
  }

  return (data as StudentRow[]).map(rowToStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load student: ${error.message}`);
  }

  return data ? rowToStudent(data as StudentRow) : null;
}

export async function updateStudent(id: string, formData: FormData) {
  const result = studentUpdateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid student";
    redirect(`/students?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("students")
    .update({
      name: result.data.name,
      cohort_id: result.data.classId,
      external_id: result.data.externalId,
      age: result.data.age,
      family_name: result.data.familyName,
      allergies: result.data.allergies,
      health_flags: result.data.healthFlags,
      prosocial_traits: result.data.prosocialTraits,
      antisocial_traits: result.data.antisocialTraits,
      constraints: result.data.constraints,
      together_ids: result.data.togetherIds,
      separate_ids: result.data.separateIds,
      notes: result.data.notes,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
}

export async function assignStudentsToClass(studentIds: string[], classId: string | null) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("students")
    .update({ cohort_id: classId })
    .in("id", studentIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update students: ${error.message}`);
  }

  revalidatePath("/students");
}

export async function deleteStudent(id: string) {
  const { supabase, userId } = await requireUser();

  const { data: allCharts } = await supabase
    .from("seating_charts")
    .select("id, name, assignments, stale_reasons")
    .eq("user_id", userId);

  if (allCharts) {
    const affected = allCharts.filter((chart) =>
      Object.values(chart.assignments as Record<string, string>).includes(id),
    );

    if (affected.length > 0) {
      await Promise.all(
        affected.map((chart) => {
          const reasons = Array.from(
            new Set([...chart.stale_reasons, "student was removed"]),
          );
          return supabase
            .from("seating_charts")
            .update({
              stale: true,
              stale_reasons: reasons,
            })
            .eq("id", chart.id);
        }),
      );
    }
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  revalidatePath("/charts");
  redirect("/students");
}

/**
 * Bulk-delete multiple students in one round-trip. Used by the
 * students table's selection-toolbar "Delete Selected" action.
 *
 * Stale-flagging behavior matches per-student delete: any
 * seating_chart whose assignments map references one of these IDs
 * gets stale=true with reason "student was removed". Per CLAUDE.md
 * we do NOT mutate the chart's assignments — the seat becomes
 * orphaned, the UI renders it empty, the user regenerates when ready.
 */
export async function deleteStudents(ids: string[]) {
  if (ids.length === 0) return;
  const { supabase, userId } = await requireUser();

  const { data: allCharts } = await supabase
    .from("seating_charts")
    .select("id, assignments, stale_reasons")
    .eq("user_id", userId);

  if (allCharts) {
    const affected = allCharts.filter((chart) => {
      const placed = Object.values(chart.assignments as Record<string, string>);
      return ids.some((id) => placed.includes(id));
    });

    if (affected.length > 0) {
      await Promise.all(
        affected.map((chart) => {
          const reasons = Array.from(
            new Set([...chart.stale_reasons, "student was removed"]),
          );
          return supabase
            .from("seating_charts")
            .update({ stale: true, stale_reasons: reasons })
            .eq("id", chart.id);
        }),
      );
    }
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .in("id", ids)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete students: ${error.message}`);
  }

  revalidatePath("/students");
  revalidatePath("/charts");
}

