export type CommunicationLevel = "verbal" | "semi-verbal" | "non-verbal";
export type Context = "home" | "school" | "mixed";
export type Sensory = "sound" | "light" | "touch" | "crowds";

export type ProfileInput = {
  age: number;
  communicationLevel: CommunicationLevel;
  sensorySensitivity: Sensory[];
  goal: string;
  context: Context;
};

export type RoutineStep = {
  id: string;
  title: string;
  durationMin: number;
  instructions: string[];
  visualSupport?: string[]; // pictogramas, checklist, temporizador, etc.
  sensoryNotes?: string[];  // reducir ruido, luz, transición, etc.
  backupPlan?: string[];    // plan B si hay resistencia/sobrecarga
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
