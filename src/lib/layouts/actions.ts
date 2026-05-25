"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { layoutCreateSchema, layoutUpdateSchema } from "./schemas";
import { rowToLayout, layoutToInsert, type LayoutRow } from "./db";
import { createTraditionalGrid } from "./grid";
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

export async function createDefaultLayout() {
  const { supabase, userId } = await requireUser();

  const grid = createTraditionalGrid(5, 6);
  const { data, error } = await supabase
    .from("layouts")
    .insert(
      layoutToInsert(
        {
          name: "Untitled layout",
          type: "traditional",
          rows: 5,
          columns: 6,
          numGroups: null,
          studentsPerGroup: null,
          grid,
        },
        userId,
      ),
    )
    .select("id")
    .single();

  if (error) {
    redirect(`/layouts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/layouts");
  redirect(`/layouts/${data!.id}`);
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

  // Mark all charts using this layout as stale
  // Note: For v1, we fetch and update individually to keep it simple.
  const { data: chartsToMark } = await supabase
    .from("seating_charts")
    .select("id, stale_reasons")
    .eq("layout_id", id);

  if (chartsToMark && chartsToMark.length > 0) {
    await Promise.all(
      chartsToMark.map((chart) => {
        const reasons = Array.from(
          new Set([...chart.stale_reasons, "layout was updated"]),
        );
        return supabase
          .from("seating_charts")
          .update({ stale: true, stale_reasons: reasons })
          .eq("id", chart.id);
      }),
    );
  }

  revalidatePath("/layouts");
  revalidatePath(`/layouts/${id}`);
  revalidatePath("/charts");
}

export async function duplicateLayout(id: string) {
  const { supabase, userId } = await requireUser();

  const { data: source, error: fetchError } = await supabase
    .from("layouts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !source) {
    redirect("/layouts?error=Source+layout+not+found");
  }

  const sourceLayout = rowToLayout(source as LayoutRow);

  const { data: inserted, error: insertError } = await supabase
    .from("layouts")
    .insert(
      layoutToInsert(
        {
          name: `${sourceLayout.name} (copy)`,
          type: sourceLayout.type,
          rows: sourceLayout.rows,
          columns: sourceLayout.columns,
          numGroups: sourceLayout.numGroups,
          studentsPerGroup: sourceLayout.studentsPerGroup,
          grid: sourceLayout.grid,
        },
        userId,
      ),
    )
    .select("id")
    .single();

  if (insertError) {
    redirect(`/layouts?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/layouts");
  redirect(`/layouts/${inserted!.id}`);
}

export async function deleteLayout(id: string) {
  const { supabase, userId } = await requireUser();

  // Check if layout is in use
  const { count, error: countError } = await supabase
    .from("seating_charts")
    .select("*", { count: "exact", head: true })
    .eq("layout_id", id);

  if (countError) {
    redirect(`/layouts?error=${encodeURIComponent(countError.message)}`);
  }

  if (count && count > 0) {
    redirect(
      `/layouts?error=${encodeURIComponent(
        `This layout is used by ${count} chart${
          count === 1 ? "" : "s"
        }. Delete or duplicate them first.`,
      )}`,
    );
  }

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
