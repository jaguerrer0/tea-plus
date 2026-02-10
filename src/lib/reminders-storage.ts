import type { Reminder } from "@/lib/types";

const REMINDERS_KEY = "tea_plus_reminders_v1";

export function loadReminders(): Reminder[] {
  const raw = localStorage.getItem(REMINDERS_KEY);
  return raw ? (JSON.parse(raw) as Reminder[]) : [];
}

export function saveReminders(list: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(list));
}

export function upsertReminder(rem: Reminder) {
  const list = loadReminders();
  const next = list.filter((x) => x.id !== rem.id);
  next.push(rem);
  saveReminders(next);
}

export function deleteReminder(id: string) {
  const list = loadReminders();
  saveReminders(list.filter((x) => x.id !== id));
}
