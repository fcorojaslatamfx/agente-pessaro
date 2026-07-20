import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const TIMEZONE = "America/Santiago";

function mostRecentMondayStartUtc(): Date {
  const now = new Date();
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }));
  const day = localNow.getDay(); // 0 = Sunday
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(localNow);
  monday.setDate(localNow.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Fallback monitoring for the weekly cron (section 8): since Supabase Cron
 * has no built-in retries/alerts, surface a banner if it's past the
 * expected 09:00 review window on a Monday and no cron-sourced request
 * exists yet for this week.
 */
export async function checkWeeklyCronHealth(supabase: SupabaseClient): Promise<{
  isLate: boolean;
  weekStart: string;
}> {
  const weekStart = mostRecentMondayStartUtc();
  const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
  const isMondayAfterReviewWindow =
    nowLocal.getDay() === 1 &&
    (nowLocal.getHours() > 9 || (nowLocal.getHours() === 9 && nowLocal.getMinutes() >= 30));
  const isPastMonday = nowLocal > weekStart && nowLocal.getDay() !== 1 ? true : isMondayAfterReviewWindow;

  if (!isPastMonday) {
    return { isLate: false, weekStart: weekStart.toISOString() };
  }

  const { count } = await supabase
    .from("ai_content_requests")
    .select("id", { count: "exact", head: true })
    .eq("source", "cron")
    .gte("created_at", weekStart.toISOString());

  return { isLate: (count ?? 0) === 0, weekStart: weekStart.toISOString() };
}
