// src/lib/calendar-storage.ts

import type { PlannedEvent } from "@/lib/types";

const KEY_PREFIX = "tea_plus_calendar_day_"; // AJUSTA si tu prefijo real es otro

function keyForDay(day: string) {
  return `${KEY_PREFIX}${day}`;
}

export function loadEvents(day: string): PlannedEvent[] {
  const raw = localStorage.getItem(keyForDay(day));
  return raw ? (JSON.parse(raw) as PlannedEvent[]) : [];
}

export function saveEvents(day: string, list: PlannedEvent[]) {
  localStorage.setItem(keyForDay(day), JSON.stringify(list));
}

export function deleteEvent(day: string, id: string) {
  const list = loadEvents(day).filter((x) => x.id !== id);
  saveEvents(day, list);
}

/** ✅ NUEVO: trae todos los eventos de todas las fechas */
export function loadAllEvents(): PlannedEvent[] {
  const out: PlannedEvent[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith(KEY_PREFIX)) continue;

    const raw = localStorage.getItem(k);
    if (!raw) continue;

    try {
      const arr = JSON.parse(raw) as PlannedEvent[];
      if (Array.isArray(arr)) out.push(...arr);
    } catch {
      // ignore
    }
  }

  return out;
}
