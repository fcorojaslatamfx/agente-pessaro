import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AiContentPermissions = {
  can_access_agent: boolean;
  can_generate_content: boolean;
  can_generate_images: boolean;
  can_use_public_image_bank: boolean;
  can_save_drafts: boolean;
  can_submit_for_review: boolean;
  can_approve_content: boolean;
  can_approve_team_content: boolean;
  can_publish_own_social: boolean;
  can_publish_company_social: boolean;
  can_view_team_content: boolean;
  can_view_company_content: boolean;
};

const NO_PERMISSIONS: AiContentPermissions = {
  can_access_agent: false,
  can_generate_content: false,
  can_generate_images: false,
  can_use_public_image_bank: false,
  can_save_drafts: false,
  can_submit_for_review: false,
  can_approve_content: false,
  can_approve_team_content: false,
  can_publish_own_social: false,
  can_publish_company_social: false,
  can_view_team_content: false,
  can_view_company_content: false,
};

export type Profile = {
  userId: string;
  displayName: string | null;
  isSuperAdmin: boolean;
  isAsesor: boolean;
  isInterno: boolean;
  teamId: string | null;
  permissions: AiContentPermissions;
  canAccessAgent: boolean;
};

/**
 * Resolves what the current user can do in the AI Content Agent, mapping
 * onto the REAL production role vocabulary — see section 4 of
 * meta_prompt_claude_code_ai_content_agentv1.1.md. `super_admin` can live on
 * either user_profiles.role or crm_staff_profiles.role; there is no
 * `team_admin` role, only the can_approve_team_content flag.
 */
export async function resolveProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile> {
  const [userProfileRes, staffProfileRes, permissionsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("crm_staff_profiles")
      .select("role, team_id, display_name")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("ai_content_permissions")
      .select(
        "can_access_agent, can_generate_content, can_generate_images, can_use_public_image_bank, can_save_drafts, can_submit_for_review, can_approve_content, can_approve_team_content, can_publish_own_social, can_publish_company_social, can_view_team_content, can_view_company_content",
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const userRole = userProfileRes.data?.role ?? null;
  const staffRole = staffProfileRes.data?.role ?? null;
  const isSuperAdmin = userRole === "super_admin" || staffRole === "super_admin";
  const permissions = (permissionsRes.data as AiContentPermissions | null) ?? NO_PERMISSIONS;

  return {
    userId,
    displayName: staffProfileRes.data?.display_name ?? null,
    isSuperAdmin,
    isAsesor: staffRole === "asesor",
    isInterno: userRole === "interno",
    teamId: staffProfileRes.data?.team_id ?? null,
    permissions,
    canAccessAgent: isSuperAdmin || permissions.can_access_agent,
  };
}
