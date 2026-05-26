"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Class } from "@/lib/types/class";
import { classToInsert, rowToClass, type ClassRow } from "./db";
import { classCreateSchema, classUpdateSchema } from "./schemas";

const CLASS_DELETED_STALE_REASON = "class was deleted";

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

export async function createClass(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const result = classCreateSchema.safeParse({ name });

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid class";
    redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("cohorts")
    .insert(classToInsert({ name: result.data.name }, userId));

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?success=Class+created+successfully");
}

export async function updateClass(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const result = classUpdateSchema.safeParse({ name });

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid class";
    redirect(`/classes?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("cohorts")
    .update({ name: result.data.name })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/classes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/classes");
  redirect("/classes?success=Class+updated+successfully");
}

export async function listClasses(): Promise<Class[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("cohorts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load classes: ${error.message}`);
  }

  return (data as ClassRow[]).map(rowToClass);
}

export async function deleteClass(id: string) {
  const { supabase, userId } = await requireUser();

  const { data: chartsToMark, error: chartFetchError } = await supabase
    .from("seating_charts")
    .select("id, stale_reasons")
    .eq("cohort_id", id)
    .eq("user_id", userId);

  if (chartFetchError) {
    redirect(`/dashboard?error=${encodeURIComponent(chartFetchError.message)}`);
  }

  if (chartsToMark && chartsToMark.length > 0) {
    const updates = chartsToMark.map((chart) => {
      const reasons = Array.from(
        new Set([
          ...(chart.stale_reasons ?? []),
          CLASS_DELETED_STALE_REASON,
        ]),
      );

      return supabase
        .from("seating_charts")
        .update({ stale: true, stale_reasons: reasons })
        .eq("id", chart.id)
        .eq("user_id", userId);
    });

    const results = await Promise.all(updates);
    const updateError = results.find((result) => result.error)?.error;

    if (updateError) {
      redirect(`/dashboard?error=${encodeURIComponent(updateError.message)}`);
    }
  }

  const { error } = await supabase
    .from("cohorts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/charts");
  revalidatePath("/charts/new");
}
