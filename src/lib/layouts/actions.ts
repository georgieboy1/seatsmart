"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { layoutCreateSchema, layoutUpdateSchema } from "./schemas";
import { rowToLayout, layoutToInsert, type LayoutRow } from "./db";
import type { ClassroomLayout } from "@/lib/types/layout";

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

function parseFormData(formData: FormData) {
  const type = formData.get("type");
  const isTraditional = type === "traditional";

  const num = (key: string): number | null => {
    const val = formData.get(key);
    if (val == null || val === "") return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  let grid: unknown = [];
  try {
    grid = JSON.parse(String(formData.get("grid") ?? "[]"));
  } catch {
    grid = [];
  }

  return {
    name: String(formData.get("name") ?? ""),
    type,
    rows: isTraditional ? num("rows") : null,
    columns: isTraditional ? num("columns") : null,
    numGroups: !isTraditional ? num("numGroups") : null,
    studentsPerGroup: !isTraditional ? num("studentsPerGroup") : null,
    grid,
  };
}

export async function createLayout(formData: FormData) {
  const result = layoutCreateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid layout";
    redirect(`/layouts/new?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("layouts")
    .insert(layoutToInsert(result.data, userId))
    .select("id")
    .single();

  if (error) {
    redirect(`/layouts/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/layouts");
  redirect(`/layouts/${data.id}`);
}

export async function listLayouts(): Promise<ClassroomLayout[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("layouts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load layouts: ${error.message}`);
  }

  return (data as LayoutRow[]).map(rowToLayout);
}

export async function getLayout(id: string): Promise<ClassroomLayout | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("layouts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load layout: ${error.message}`);
  }

  return data ? rowToLayout(data as LayoutRow) : null;
}

export async function updateLayout(id: string, formData: FormData) {
  const result = layoutUpdateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid layout";
    redirect(`/layouts/${id}?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("layouts")
    .update({
      name: result.data.name,
      type: result.data.type,
      rows: result.data.rows,
      columns: result.data.columns,
      num_groups: result.data.numGroups,
      students_per_group: result.data.studentsPerGroup,
      grid: result.data.grid,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/layouts/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/layouts");
  revalidatePath(`/layouts/${id}`);
}

export async function deleteLayout(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("layouts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/layouts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/layouts");
  redirect("/layouts");
}
