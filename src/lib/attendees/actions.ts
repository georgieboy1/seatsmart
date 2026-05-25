"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Attendee } from "@/lib/types/attendee";
import { parseAttendeesCsv } from "./csv";
import { rowToAttendee, attendeeToInsert, type AttendeeRow } from "./db";
import { attendeeCreateSchema, attendeeUpdateSchema } from "./schemas";

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
    cohortId: formData.get("cohortId") ? String(formData.get("cohortId")) : null,
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

export async function createAttendee(formData: FormData) {
  const result = attendeeCreateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid attendee";
    redirect(`/attendees?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("attendees")
    .insert(attendeeToInsert(result.data, userId));

  if (error) {
    redirect(`/attendees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/attendees");
  redirect("/attendees");
}

export async function importAttendeesCsv(formData: FormData) {
  const file = formData.get("csv");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/attendees?error=Choose+a+CSV+file+to+import");
  }

  let attendees;
  try {
    attendees = parseAttendeesCsv(await file.text());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CSV";
    redirect(`/attendees?error=${encodeURIComponent(message)}`);
  }

  if (attendees.length === 0) {
    redirect("/attendees?error=CSV+does+not+contain+any+attendee+rows");
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("attendees")
    .insert(attendees.map((attendee) => attendeeToInsert(attendee, userId)));

  if (error) {
    redirect(`/attendees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/attendees");
  redirect(
    `/attendees?success=${encodeURIComponent(
      `Imported ${attendees.length} attendee${attendees.length === 1 ? "" : "s"}`,
    )}`,
  );
}

export async function listAttendees(cohortId?: string): Promise<Attendee[]> {
  const { supabase, userId } = await requireUser();

  let query = supabase
    .from("attendees")
    .select("*")
    .eq("user_id", userId);

  if (cohortId) {
    query = query.eq("cohort_id", cohortId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load attendees: ${error.message}`);
  }

  return (data as AttendeeRow[]).map(rowToAttendee);
}

export async function getAttendee(id: string): Promise<Attendee | null> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load attendee: ${error.message}`);
  }

  return data ? rowToAttendee(data as AttendeeRow) : null;
}

export async function updateAttendee(id: string, formData: FormData) {
  const result = attendeeUpdateSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid attendee";
    redirect(`/attendees?error=${encodeURIComponent(message)}`);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("attendees")
    .update({
      name: result.data.name,
      cohort_id: result.data.cohortId,
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
    redirect(`/attendees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/attendees");
}

export async function assignAttendeesToCohort(attendeeIds: string[], cohortId: string | null) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("attendees")
    .update({ cohort_id: cohortId })
    .in("id", attendeeIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update attendees: ${error.message}`);
  }

  revalidatePath("/attendees");
}

export async function deleteAttendee(id: string) {
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
            new Set([...chart.stale_reasons, "attendee was removed"]),
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
    .from("attendees")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/attendees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/attendees");
  revalidatePath("/charts");
  redirect("/attendees");
}

/**
 * Bulk-delete multiple attendees in one round-trip. Used by the
 * attendees table's selection-toolbar "Delete Selected" action.
 *
 * Stale-flagging behavior matches per-attendee delete: any
 * seating_chart whose assignments map references one of these IDs
 * gets stale=true with reason "attendee was removed". Per CLAUDE.md
 * we do NOT mutate the chart's assignments — the seat becomes
 * orphaned, the UI renders it empty, the user regenerates when ready.
 */
export async function deleteAttendees(ids: string[]) {
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
            new Set([...chart.stale_reasons, "attendee was removed"]),
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
    .from("attendees")
    .delete()
    .in("id", ids)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete attendees: ${error.message}`);
  }

  revalidatePath("/attendees");
  revalidatePath("/charts");
}
