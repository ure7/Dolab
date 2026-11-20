const DAY = 86_400_000;

/** The date `days` days ago, as "YYYY-MM-DD" (UTC). */
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
}

/** The first day of the current month, as "YYYY-MM-01". */
export function startOfMonth(): string {
  return new Date().toISOString().slice(0, 8) + "01";
}
