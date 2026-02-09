import type { ProfileInput, Routine } from "@/lib/types";

const PROFILE_KEY = "tea_plus_profile_v1";
const ROUTINE_KEY = "tea_plus_last_routine_v1";

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
