import type { Profile } from "@/lib/auth/permissions";
import type { ContentStatus } from "@/lib/content/types";

export type OutputRow = {
  owner_user_id: string;
  team_id: string | null;
  status: ContentStatus;
};

type TransitionRule = {
  to: ContentStatus;
  allowed: (profile: Profile, output: OutputRow) => boolean;
};

const isOwner = (profile: Profile, output: OutputRow) => profile.userId === output.owner_user_id;
const isTeamReviewer = (profile: Profile, output: OutputRow) =>
  profile.permissions.can_approve_team_content &&
  profile.teamId !== null &&
  profile.teamId === output.team_id;
const isSuperAdmin = (profile: Profile) => profile.isSuperAdmin;

// Misma regla que gobierna ready_to_publish -> published (abajo), expuesta
// aparte porque lib/content/publish-actions.ts la reutiliza: ahí el output
// puede quedarse en "published" tras el primer canal enviado y el usuario
// igual debe poder disparar el envío a otras plataformas.
export const canPublishSocial = (profile: Profile, output: OutputRow) =>
  (isOwner(profile, output) && profile.permissions.can_publish_own_social) ||
  profile.permissions.can_publish_company_social ||
  isSuperAdmin(profile);

// Approval flow (section 5): pending_review -> [team_review] -> super_admin_review -> approved/ready_to_publish.
const RULES: Record<ContentStatus, TransitionRule[]> = {
  draft: [{ to: "pending_review", allowed: (p, o) => isOwner(p, o) && p.permissions.can_submit_for_review }],
  pending_review: [
    { to: "draft", allowed: (p, o) => isOwner(p, o) },
    { to: "team_review", allowed: isTeamReviewer },
    { to: "super_admin_review", allowed: (p, o) => isTeamReviewer(p, o) || isSuperAdmin(p) },
    { to: "rejected", allowed: (p) => isSuperAdmin(p) },
  ],
  team_review: [
    { to: "super_admin_review", allowed: isTeamReviewer },
    { to: "rejected", allowed: isTeamReviewer },
    { to: "changes_requested", allowed: isTeamReviewer },
  ],
  super_admin_review: [
    { to: "approved", allowed: (p) => isSuperAdmin(p) },
    { to: "ready_to_publish", allowed: (p) => isSuperAdmin(p) },
    { to: "rejected", allowed: (p) => isSuperAdmin(p) },
    { to: "changes_requested", allowed: (p) => isSuperAdmin(p) },
  ],
  changes_requested: [{ to: "pending_review", allowed: (p, o) => isOwner(p, o) }],
  approved: [{ to: "ready_to_publish", allowed: (p) => isSuperAdmin(p) }],
  ready_to_publish: [{ to: "published", allowed: canPublishSocial }],
  rejected: [],
  published: [{ to: "archived", allowed: (p) => isSuperAdmin(p) }],
  archived: [],
};

export function canTransition(profile: Profile, output: OutputRow, to: ContentStatus): boolean {
  const rules = RULES[output.status] ?? [];
  return rules.some((rule) => rule.to === to && rule.allowed(profile, output));
}

export function availableTransitions(profile: Profile, output: OutputRow): ContentStatus[] {
  const rules = RULES[output.status] ?? [];
  return rules.filter((rule) => rule.allowed(profile, output)).map((rule) => rule.to);
}
