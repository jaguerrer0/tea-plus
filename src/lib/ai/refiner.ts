import type { Routine, Feedback } from "@/lib/types";

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function refineRoutine(prev: Routine, feedback: Feedback[]): Routine {
  const next = clone(prev);

  // Regla: si un paso fue "hard" o "failed", reducimos duración y fortalecemos plan B
  const hardSteps = new Set(
    feedback.filter(f => f.outcome !== "ok").map(f => f.stepId)
  );

  for (const block of next.blocks) {
    for (const step of block.steps) {
      if (hardSteps.has(step.id)) {
        step.durationMin = Math.max(2, Math.floor(step.durationMin * 0.7));
        step.backupPlan = Array.from(new Set([
          ...(step.backupPlan ?? []),
          "Convertirlo en micro-pasos (1 acción).",
          "Reducir estímulos (silencio/luz suave).",
          "Terminar con una señal clara: 'listo' + refuerzo breve.",
        ]));
      }
    }
  }

  next.explainability = Array.from(new Set([
    ...(next.explainability ?? []),
    "Se ajustaron duraciones y planes B según feedback del cuidador.",
  ]));

  return next;
}
