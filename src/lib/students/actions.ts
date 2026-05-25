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
    prosocialTraits: formArray(formData, "prosocialTraits"),
    antisocialTraits: formArray(formData, "antisocialTraits"),
    accommodations: formArray(formData, "accommodations"),
    peerTutors: formArray(formData, "peerTutors"),
    avoid: formArray(formData, "avoid"),
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

export async function listStudents(): Promise<Student[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

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
      prosocial_traits: result.data.prosocialTraits,
      antisocial_traits: result.data.antisocialTraits,
      accommodations: result.data.accommodations,
      peer_tutors: result.data.peerTutors,
      avoid: result.data.avoid,
      notes: result.data.notes,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
}

export async function deleteStudent(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/students?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/students");
  redirect("/students");
}
