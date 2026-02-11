import type { DailyStats } from "@/lib/types";

const STATS_PREFIX = "tea_plus_stats_v1";

export function statsKey(day: string) {
  return `${STATS_PREFIX}_${day}`;
}

export function saveDailyStats(stats: DailyStats) {
  localStorage.setItem(statsKey(stats.day), JSON.stringify(stats));
}

export function loadDailyStats(day: string): DailyStats | null {
  const raw = localStorage.getItem(statsKey(day));
  return raw ? (JSON.parse(raw) as DailyStats) : null;
}

export function loadLastNDaysStats(days: number): DailyStats[] {
  const out: DailyStats[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    const s = loadDailyStats(dayKey);
    if (s) out.push(s);
  }
  return out;
}
