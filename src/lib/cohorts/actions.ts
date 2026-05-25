"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cohort } from "@/lib/types/cohort";
import { cohortToInsert, rowToCohort, type CohortRow } from "./db";
import { cohortCreateSchema, cohortUpdateSchema } from "./schemas";

const COHORT_DELETED_STALE_REASON = "cohort was deleted";

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

export async function createCohort(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const result = cohortCreateSchema.safeParse({ name });

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid cohort";
    redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("cohorts")
    .insert({ name: result.data.name, user_id: userId });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?success=Cohort+created+successfully");
}

export async function updateCohort(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const result = cohortUpdateSchema.safeParse({ name });

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid cohort";
    redirect(`/cohorts?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("cohorts")
    .update({ name: result.data.name })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/cohorts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/cohorts");
  redirect("/cohorts?success=Cohort+updated+successfully");
}

export async function listCohorts(): Promise<Cohort[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("cohorts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load cohorts: ${error.message}`);
  }

  return (data as CohortRow[]).map(rowToCohort);
}

export async function deleteCohort(id: string) {
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
          COHORT_DELETED_STALE_REASON,
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
  revalidatePath("/attendees");
  revalidatePath("/charts");
  revalidatePath("/charts/new");
}
