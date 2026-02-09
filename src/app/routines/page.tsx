"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feedback, ProfileInput, Routine, RoutineStep } from "@/lib/types";
import { loadLastRoutine, loadProfile, saveLastRoutine } from "@/lib/storage";

function BlockTitle({ label }: { label: string }) {
  const map: Record<string, string> = { morning: "Mañana", afternoon: "Tarde", evening: "Noche" };
  return <h2 className="text-lg font-semibold">{map[label] ?? label}</h2>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs">{children}</span>;
}

function StepCard({
  step,
  onFeedback,
}: {
  step: RoutineStep;
  onFeedback: (outcome: Feedback["outcome"]) => void;
}) {
  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{step.title}</div>
          <div className="mt-1 flex gap-2 flex-wrap">
            <Pill>{step.durationMin} min</Pill>
            {step.visualSupport?.length ? <Pill>Apoyo visual</Pill> : null}
            {step.sensoryNotes?.length ? <Pill>Sensory</Pill> : null}
            {step.backupPlan?.length ? <Pill>Plan B</Pill> : null}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onFeedback("ok")} className="rounded-xl border px-3 py-2 text-sm">
            OK
          </button>
          <button onClick={() => onFeedback("hard")} className="rounded-xl border px-3 py-2 text-sm">
            Difícil
          </button>
          <button onClick={() => onFeedback("failed")} className="rounded-xl border px-3 py-2 text-sm">
            Falló
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-sm font-medium">Instrucciones</div>
          <ul className="mt-1 list-disc ml-5 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
            {step.instructions.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          {step.visualSupport?.length ? (
            <div>
              <div className="text-sm font-medium">Apoyo visual</div>
              <div className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {step.visualSupport.join(", ")}
              </div>
            </div>
          ) : null}

          {step.sensoryNotes?.length ? (
            <div>
              <div className="text-sm font-medium">Notas sensoriales</div>
              <ul className="mt-1 list-disc ml-5 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                {step.sensoryNotes.map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {step.backupPlan?.length ? (
            <div>
              <div className="text-sm font-medium">Plan B</div>
              <ul className="mt-1 list-disc ml-5 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                {step.backupPlan.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function RoutinesPage() {
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setRoutine(loadLastRoutine());
  }, []);

  const canGenerate = !!profile;

  const feedbackByStep = useMemo(() => {
    const map = new Map<string, Feedback["outcome"]>();
    for (const f of feedback) map.set(f.stepId, f.outcome);
    return map;
  }, [feedback]);

  async function generate() {
    if (!profile) return;
    setStatus("Generando rutina…");
    setFeedback([]);

    const res = await fetch("/api/routines/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data?.error ?? "No se pudo generar"}`);
      return;
    }

    setRoutine(data.routine);
    saveLastRoutine(data.routine);
    setStatus("Rutina generada.");
    setTimeout(() => setStatus(""), 1200);
  }

  async function refine() {
    if (!routine) return;
    if (feedback.length === 0) {
      setStatus("Agrega feedback en al menos un paso (Difícil o Falló).");
      setTimeout(() => setStatus(""), 1500);
      return;
    }

    setStatus("Refinando rutina…");
    const res = await fetch("/api/routines/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routine, feedback }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data?.error ?? "No se pudo refinar"}`);
      return;
    }

    setRoutine(data.routine);
    saveLastRoutine(data.routine);
    setStatus("Rutina refinada.");
    setTimeout(() => setStatus(""), 1200);
  }

  function addFeedback(stepId: string, outcome: Feedback["outcome"]) {
    if (!routine) return;
    setFeedback((prev) => {
      const next = prev.filter((f) => f.stepId !== stepId);
      next.push({ routineId: "local", stepId, outcome });
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">Rutinas</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Generación por reglas + adaptación por feedback (explicable).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="rounded-xl px-4 py-2 border bg-neutral-900 text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              Generar
            </button>
            <button
              onClick={refine}
              disabled={!routine}
              className="rounded-xl px-4 py-2 border disabled:opacity-40"
            >
              Refinar con feedback
            </button>
          </div>
        </div>

        {!profile ? (
          <div className="mt-4 rounded-xl border p-4 text-sm">
            No hay perfil guardado. Ve a <b>Perfil</b> y guarda uno para generar rutinas.
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-4 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600 dark:text-neutral-400">Edad</div>
              <div className="font-medium">{profile.age}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600 dark:text-neutral-400">Comunicación</div>
              <div className="font-medium">{profile.communicationLevel}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600 dark:text-neutral-400">Contexto</div>
              <div className="font-medium">{profile.context}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-neutral-600 dark:text-neutral-400">Sensibilidades</div>
              <div className="font-medium">{profile.sensorySensitivity.join(", ") || "—"}</div>
            </div>
          </div>
        )}

        {status ? <div className="mt-4 text-sm">{status}</div> : null}
      </section>

      {!routine ? (
        <section className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Genera una rutina para verla aquí.
          </div>
        </section>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
            <div className="text-lg font-semibold">{routine.title}</div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Objetivo: <span className="text-neutral-900 dark:text-neutral-50">{routine.goal}</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
              <div className="rounded-xl border p-4">
                <div className="font-medium">Plan de cambios</div>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  {routine.changePlan.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border p-4">
                <div className="font-medium">Señales de sobrecarga</div>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  {routine.overloadSignals.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border p-4">
                <div className="font-medium">Notas para cuidador</div>
                <ul className="mt-2 list-disc ml-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  {routine.caregiverNotes.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {routine.blocks.map((b) => (
            <section key={b.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <BlockTitle label={b.label} />
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Feedback marcado:{" "}
                  {b.steps.filter((s) => feedbackByStep.get(s.id) && feedbackByStep.get(s.id) !== "ok").length}
                </div>
              </div>
              <div className="grid gap-3">
                {b.steps.map((s) => (
                  <div key={s.id} className="space-y-2">
                    <StepCard
                      step={s}
                      onFeedback={(outcome) => addFeedback(s.id, outcome)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
