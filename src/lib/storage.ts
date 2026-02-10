import type { ProfileInput, Routine, Feedback } from "@/lib/types";

const PROFILE_KEY = "tea_plus_profile_v1";
const ROUTINE_KEY = "tea_plus_last_routine_v1";

// Ahora checklist/feedback serán por día, para que no se “pegue” entre días
const CHECKLIST_KEY_PREFIX = "tea_plus_checklist_v1";
const FEEDBACK_KEY_PREFIX = "tea_plus_feedback_v1";

function todayKey() {
  // YYYY-MM-DD en horario local del navegador
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function checklistKey(day = todayKey()) {
  return `${CHECKLIST_KEY_PREFIX}_${day}`;
}

function feedbackKey(day = todayKey()) {
  return `${FEEDBACK_KEY_PREFIX}_${day}`;
}

export function saveProfile(profile: ProfileInput) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): ProfileInput | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as ProfileInput) : null;
}

export function saveLastRoutine(routine: Routine) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
}

export function loadLastRoutine(): Routine | null {
  const raw = localStorage.getItem(ROUTINE_KEY);
  return raw ? (JSON.parse(raw) as Routine) : null;
}

/** Checklist por día */
export function saveChecklist(stepIdsDone: string[], day?: string) {
  localStorage.setItem(checklistKey(day), JSON.stringify(stepIdsDone));
}

export function loadChecklist(day?: string): string[] {
  const raw = localStorage.getItem(checklistKey(day));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

/** Feedback por día */
export function saveFeedback(list: Feedback[], day?: string) {
  localStorage.setItem(feedbackKey(day), JSON.stringify(list));
}

export function loadFeedback(day?: string): Feedback[] {
  const raw = localStorage.getItem(feedbackKey(day));
  return raw ? (JSON.parse(raw) as Feedback[]) : [];
}

/** Limpia solo “sesión” del día actual (checklist+feedback) */
export function clearSessionData(day?: string) {
  localStorage.removeItem(checklistKey(day));
  localStorage.removeItem(feedbackKey(day));
}

/** Útil para UI: saber el día actual */
export function getTodayKey() {
  return todayKey();
}
