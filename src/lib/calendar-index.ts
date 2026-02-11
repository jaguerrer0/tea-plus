import type { PlannedEvent } from "@/lib/types";

const PREFIX = "tea_plus_events_v1_";

/**
 * Escanea localStorage para obtener un set de días (YYYY-MM-DD) con eventos.
 * Útil para pintar un calendario anual sin una base de datos.
 */
export function listDaysWithEvents(year: number): Set<string> {
  const days = new Set<string>();
  const y = String(year);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    const day = k.slice(PREFIX.length);
    if (day.startsWith(y + "-")) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const arr = JSON.parse(raw) as PlannedEvent[];
        if (Array.isArray(arr) && arr.length) days.add(day);
      } catch {
        // ignore
      }
    }
  }
  return days;
}
