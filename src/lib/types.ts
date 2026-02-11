export type CommunicationLevel = "verbal" | "semi-verbal" | "non-verbal";
export type Context = "home" | "school" | "mixed";
export type Sensory = "sound" | "light" | "touch" | "crowds";
export type RoutineFocus = "full-day" | "morning" | "afternoon" | "evening";

export type SupportLevel = "low" | "moderate" | "high";

export type ProfileInput = {
  name?: string;
  age: number;
  communicationLevel: CommunicationLevel;
  sensorySensitivity: Sensory[];
  supportLevel?: SupportLevel;
  routineFocus?: RoutineFocus;
  goal: string;
  context: Context;
};

export type DailyStats = {
  day: string;
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
  visualSupport?: string[];
  visualAssets?: { type: "pictogram" | "photo"; src: string; label?: string }[];
  sensoryNotes?: string[];
  backupPlan?: string[];
};

export type PlannedEventCategory = "therapy" | "school" | "family" | "outing" | "medication" | "custom";

export type PlannedEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  category?: PlannedEventCategory;
  location?: string;
  preparation?: string[];
  pictogramSrc?: string;
};

export type ReminderKind = "therapy" | "medication" | "appointment" | "custom";

export type Reminder = {
  id: string;
  title: string;
  kind: ReminderKind;
  datetimeISO: string;
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
  photoRef?: string;
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
  explainability: string[];
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
