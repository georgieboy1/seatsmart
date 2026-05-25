import { createClient } from "@/lib/supabase/server";
import type { WorkspaceType } from "@/lib/utils/terminology";

export type Profile = {
  id: string;
  workspaceType: WorkspaceType;
  updatedAt: string;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    workspaceType: data.workspace_type as WorkspaceType,
    updatedAt: data.updated_at,
  };
}

export async function updateWorkspaceType(type: WorkspaceType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      workspace_type: type,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}
