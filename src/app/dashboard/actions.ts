"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateWorkspaceType, getProfile } from "@/lib/attendees/profile";
import { revalidatePath } from "next/cache";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function toggleWorkspace() {
  const profile = await getProfile();
  const nextType = profile?.workspaceType === "events" ? "education" : "events";
  await updateWorkspaceType(nextType);
  revalidatePath("/");
  revalidatePath("/dashboard");
}
