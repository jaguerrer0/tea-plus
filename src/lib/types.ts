export type CommunicationLevel = "verbal" | "semi-verbal" | "non-verbal";
export type Context = "home" | "school" | "mixed";
export type Sensory = "sound" | "light" | "touch" | "crowds";
export type RoutineFocus = "full-day" | "morning" | "afternoon" | "evening";

/** Nivel de apoyo (no es diagnóstico; es una guía práctica para ajustar la estructura). */
export type SupportLevel = "low" | "moderate" | "high";

export type ProfileInput = {
  /** Nombre (solo uno) para personalizar. Opcional. */
  name?: string;
  age: number;
  communicationLevel: CommunicationLevel;
  sensorySensitivity: Sensory[];
  /** Nivel de apoyo requerido en el día a día. Opcional. */
  supportLevel?: SupportLevel;
  /** Enfoque de rutina: día completo o solo un bloque. Opcional. */
  routineFocus?: RoutineFocus;
  goal: string;
  context: Context;
};

export type DailyStats = {
  day: string; // YYYY-MM-DD
  totalSteps: number;
  doneSteps: number;
  completionPct: number;
  hardCount: number;
  failedCount: number;
  createdAtISO: string;
};

export type RoutineStep = {
  id: string;
  title: string;
  durationMin: number;
  instructions: string[];
  visualSupport?: string[]; // pictogramas, checklist, temporizador, etc.
  /** Activos visuales opcionales (pictogramas/fotos) añadidos por el cuidador. */
  visualAssets?: { type: "pictogram" | "photo"; src: string; label?: string }[];
  sensoryNotes?: string[];  // reducir ruido, luz, transición, etc.
  backupPlan?: string[];    // plan B si hay resistencia/sobrecarga
};

export type PlannedEventCategory = "therapy" | "school" | "family" | "outing" | "medication" | "custom";

export type PlannedEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (opcional)
  title: string;
  category?: PlannedEventCategory;
  location?: string;
  preparation?: string[];
  pictogramSrc?: string; // URL/dataURL opcional
};

export type ReminderKind = "therapy" | "medication" | "appointment" | "custom";

export type Reminder = {
  id: string;
  title: string;
  kind: ReminderKind;
  datetimeISO: string; // ISO
  repeat: "none" | "daily" | "weekly";
  notes?: string;
  enabled: boolean;
};

export type PersonRelation =
  | "dad"
  | "mom"
  | "brother"
  | "sister"
  | "grandpa"
  | "grandma"
  | "uncle"
  | "aunt"
  | "cousin"
  | "caregiver"
  | "teacher"
  | "therapist"
  | "other";

export type PersonCard = {
  id: string;
  displayName: string;
  relation: PersonRelation;
  /** ID de blob (IndexedDB) o URL. */
  photoRef?: string;
  /** ID de blob (IndexedDB) o URL. */
  audioRef?: string;
  audioText?: string;
  createdAtISO: string;
};

export type RoutineBlock = {
  label: "morning" | "afternoon" | "evening";
  steps: RoutineStep[];
};

export type Routine = {
  title: string;
  goal: string;
  blocks: RoutineBlock[];
  changePlan: string[];
  overloadSignals: string[];
  caregiverNotes: string[];
  explainability: string[]; // por qué se eligieron pasos
};

export type Feedback = {
  routineId: string;
  stepId: string;
  outcome: "ok" | "hard" | "failed";
  note?: string;
};

export type GenerateRoutineResponse = {
  routine: Routine;
};

export type RefineRoutineResponse = {
  routine: Routine;
};
