"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chartToInsert, rowToChart, type ChartRow } from "./db";
import type { NewSeatingChart, SeatingChart } from "@/lib/types/chart";

import { chartUpdateSchema } from "./schemas";

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

export async function createChart(chart: NewSeatingChart) {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("seating_charts")
    .insert(chartToInsert(chart, userId))
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create chart: ${error.message}`);
  }

  revalidatePath("/charts");
  revalidatePath("/dashboard");
  return data.id;
}

export async function updateChart(id: string, payload: Partial<NewSeatingChart>) {
  const result = chartUpdateSchema.safeParse(payload);

  if (!result.success) {
    throw new Error(`Invalid chart data: ${result.error.issues[0]?.message}`);
  }

  const { supabase, userId } = await requireUser();

  const updateData: Partial<{
    name: string;
    assignments: Record<string, string>;
    locked_seats: Record<string, string>;
    score: number | null;
    seed: number;
    stale: boolean;
    stale_reasons: string[];
  }> = {};
  if (result.data.name !== undefined) updateData.name = result.data.name;
  if (result.data.assignments !== undefined) updateData.assignments = result.data.assignments;
  if (result.data.lockedSeats !== undefined) updateData.locked_seats = result.data.lockedSeats;
  if (result.data.score !== undefined) updateData.score = result.data.score;
  if (result.data.seed !== undefined) updateData.seed = result.data.seed;
  if (result.data.stale !== undefined) updateData.stale = result.data.stale;
  if (result.data.staleReasons !== undefined) updateData.stale_reasons = result.data.staleReasons;

  const { error } = await supabase
    .from("seating_charts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update chart: ${error.message}`);
  }

  revalidatePath("/charts");
  revalidatePath(`/charts/${id}`);
}

export async function deleteChart(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("seating_charts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete chart: ${error.message}`);
  }

  revalidatePath("/charts");
  revalidatePath("/dashboard");
  redirect("/charts");
}

export async function listCharts(): Promise<SeatingChart[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("seating_charts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load charts: ${error.message}`);
  }

  return (data as ChartRow[]).map(rowToChart);
}

export async function getChart(id: string): Promise<SeatingChart | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("seating_charts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load chart: ${error.message}`);
  }

  return data ? rowToChart(data as ChartRow) : null;
}
