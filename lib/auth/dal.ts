import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile, type Profile } from "@/lib/auth/permissions";

export type Session = {
  userId: string;
  email: string | null;
  profile: Profile;
};

/**
 * Verifies the Supabase session against the auth server (not just the
 * cookie) and resolves the user's AI Content Agent profile. Memoized per
 * request with React's cache() so it's cheap to call from every layout,
 * page, and Server Action that needs it.
 */
export const verifySession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const profile = await resolveProfile(supabase, user.id);

  return { userId: user.id, email: user.email ?? null, profile };
});

/**
 * Same as verifySession(), but also enforces module-level access
 * (super_admin OR can_access_agent) per section 4 of the meta-prompt.
 * Use this at the top of every protected page/layout.
 */
export const requireAgentAccess = cache(async (): Promise<Session> => {
  const session = await verifySession();
  if (!session.profile.canAccessAgent) {
    redirect("/login?error=no_access");
  }
  return session;
});
