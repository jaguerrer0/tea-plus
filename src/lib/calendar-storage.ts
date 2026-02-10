import type { PlannedEvent } from "@/lib/types";

const EVENTS_KEY_PREFIX = "tea_plus_events_v1";

export function eventsKey(day: string) {
  return `${EVENTS_KEY_PREFIX}_${day}`;
}

export function loadEvents(day: string): PlannedEvent[] {
  const raw = localStorage.getItem(eventsKey(day));
  return raw ? (JSON.parse(raw) as PlannedEvent[]) : [];
}

export function saveEvents(day: string, list: PlannedEvent[]) {
  localStorage.setItem(eventsKey(day), JSON.stringify(list));
}

export function upsertEvent(day: string, ev: PlannedEvent) {
  const list = loadEvents(day);
  const next = list.filter((x) => x.id !== ev.id);
  next.push(ev);
  saveEvents(day, next);
}

export function deleteEvent(day: string, id: string) {
  const list = loadEvents(day);
  saveEvents(day, list.filter((x) => x.id !== id));
}
