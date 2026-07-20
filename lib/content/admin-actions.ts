"use server";

import { revalidatePath } from "next/cache";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AiContentPermissions } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/content/actions";

export async function upsertPermissions(
  userId: string,
  teamId: string | null,
  flags: AiContentPermissions,
): Promise<ActionResult> {
  const session = await requireAgentAccess();
  if (!session.profile.isSuperAdmin) {
    return { ok: false, error: "Solo un super admin puede gestionar permisos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_content_permissions")
    .upsert(
      { user_id: userId, team_id: teamId, ...flags, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/permissions");
  return { ok: true };
}
