import { redirect } from "next/navigation";
import { requireAgentAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AiContentPermissions } from "@/lib/auth/permissions";
import { EmptyState } from "@/components/ui/EmptyState";
import PermissionRow from "./PermissionRow";

const EMPTY_FLAGS: AiContentPermissions = {
  can_access_agent: false,
  can_generate_content: false,
  can_generate_images: false,
  can_use_public_image_bank: false,
  can_save_drafts: true,
  can_submit_for_review: true,
  can_approve_content: false,
  can_approve_team_content: false,
  can_publish_own_social: true,
  can_publish_company_social: false,
  can_view_team_content: false,
  can_view_company_content: false,
};

export default async function AdminPermissionsPage() {
  const session = await requireAgentAccess();
  if (!session.profile.isSuperAdmin) redirect("/dashboard");

  const supabase = await createClient();

  const [{ data: staff }, { data: internos }, { data: permissionRows }] = await Promise.all([
    supabase.from("crm_staff_profiles").select("user_id, team_id, display_name, role"),
    supabase.from("user_profiles").select("user_id, full_name, role").eq("role", "interno"),
    supabase.from("ai_content_permissions").select("*"),
  ]);

  const permissionsByUser = new Map(
    (permissionRows ?? []).map((row) => [row.user_id as string, row as AiContentPermissions]),
  );

  const candidates = [
    ...(staff ?? []).map((s) => ({
      userId: s.user_id as string,
      teamId: (s.team_id as string | null) ?? null,
      name: s.display_name as string,
      role: s.role as string,
    })),
    ...(internos ?? []).map((u) => ({
      userId: u.user_id as string,
      teamId: null as string | null,
      name: u.full_name as string,
      role: u.role as string,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Permisos del AI Content Agent</h1>
        <p className="text-sm text-muted-foreground">
          Los roles de `user_profiles`/`crm_staff_profiles` no se modifican aquí — estas casillas
          controlan capacidades adicionales del módulo (tabla `ai_content_permissions`).
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {candidates.map((c) => (
          <PermissionRow
            key={c.userId}
            userId={c.userId}
            teamId={c.teamId}
            name={c.name}
            role={c.role}
            initial={permissionsByUser.get(c.userId) ?? EMPTY_FLAGS}
          />
        ))}
        {candidates.length === 0 && <EmptyState title="No hay usuarios candidatos" />}
      </div>
    </div>
  );
}
