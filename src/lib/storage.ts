import type { ProfileInput, Routine, Feedback } from "@/lib/types";

const PROFILE_KEY = "tea_plus_profile_v1";
const ROUTINE_KEY = "tea_plus_last_routine_v1";
const CHECKLIST_KEY = "tea_plus_checklist_v1";
const FEEDBACK_KEY = "tea_plus_feedback_v1";

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

export function saveChecklist(stepIdsDone: string[]) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(stepIdsDone));
}

export function loadChecklist(): string[] {
  const raw = localStorage.getItem(CHECKLIST_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function saveFeedback(list: Feedback[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
}

export function loadFeedback(): Feedback[] {
  const raw = localStorage.getItem(FEEDBACK_KEY);
  return raw ? (JSON.parse(raw) as Feedback[]) : [];
}

export function clearSessionData() {
  localStorage.removeItem(CHECKLIST_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}
