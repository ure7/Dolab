import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { daysAgo } from "@/lib/helpers/dates";

export type WearLog = { item_id: string; outfit_id: string | null; worn_on: string };

/** All your wear history from the last `days` days (newest first). */
export async function listWearLogs(days = 365): Promise<WearLog[]> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const since = daysAgo(days);
  const { data, error } = await supabase
    .from("wear_logs")
    .select("item_id, outfit_id, worn_on")
    .eq("user_id", userId)
    .gte("worn_on", since)
    .order("worn_on", { ascending: false });
  if (error) throw new Error(`Couldn't load wear history: ${error.message}`);
  return (data ?? []) as WearLog[];
}

/** How often, and when last, each item was worn. */
export function summarise(logs: WearLog[]) {
  const byItem = new Map<string, { count: number; last: string }>();
  for (const log of logs) {
    const entry = byItem.get(log.item_id);
    if (entry) entry.count++;
    else byItem.set(log.item_id, { count: 1, last: log.worn_on }); // logs are newest first
  }
  return byItem;
}
