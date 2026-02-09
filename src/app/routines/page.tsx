"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feedback, ProfileInput, Routine, RoutineStep } from "@/lib/types";
import {
  clearSessionData,
  loadChecklist,
  loadFeedback,
  loadLastRoutine,
  loadProfile,
  saveChecklist,
  saveFeedback,
  saveLastRoutine,
} from "@/lib/storage";

function labelBlock(label: string) {
  const map: Record<string, string> = { morning: "Mañana", afternoon: "Tarde", evening: "Noche" };
  return map[label] ?? label;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: "linear-gradient(90deg, rgba(99,102,241,1), rgba(16,185,129,0.95))",
        }}
      />
    </div>
  );
}

function Segment({
  value,
  onChange,
}: {
  value: Feedback["outcome"] | "none";
  onChange: (v: Feedback["outcome"]) => void;
}) {
  const base =
    "px-3 py-2 text-xs font-medium rounded-xl border transition select-none";
  const activeStyle = (v: string) =>
    value === v
      ? "border-transparent text-white"
      : "bg-white";

  const activeBg = (v: string) =>
    value === v
      ? { background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(99,102,241,0.78))" }
      : undefined;

  return (
    <div className="flex items-center gap-2">
      <button className={`${base} ${activeStyle("ok")}`} style={activeBg("ok")} onClick={() => onChange("ok")}>
        OK
      </button>
      <button className={`${base} ${activeStyle("hard")}`} style={activeBg("hard")} onClick={() => onChange("hard")}>
        Difícil
      </button>
      <button className={`${base} ${activeStyle("failed")}`} style={activeBg("failed")} onClick={() => onChange("failed")}>
        Falló
      </button>
    </div>
  );
}

function StepCard({
  step,
  done,
  outcome,
  onToggleDone,
  onFeedback,
}: {
  step: RoutineStep;
  done: boolean;
  outcome: Feedback["outcome"] | "none";
  onToggleDone: () => void;
  onFeedback: (v: Feedback["outcome"]) => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleDone}
              className="h-6 w-6 rounded-lg border flex items-center justify-center"
              style={
                done
                  ? { background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.35)" }
                  : undefined
              }
              aria-label="Marcar como completado"
              title="Marcar como completado"
            >
              {done ? "✓" : ""}
            </button>
            <div className="font-semibold truncate">{step.title}</div>
            <Chip>{step.durationMin} min</Chip>
            {step.visualSupport?.length ? <Chip>Apoyo visual</Chip> : null}
            {step.sensoryNotes?.length ? <Chip>Sensory</Chip> : null}
            {step.backupPlan?.length ? <Chip>Plan B</Chip> : null}
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Instrucciones</div>
              <ul className="mt-2 list-disc ml-5 text-sm muted space-y-1">
                {step.instructions.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {step.visualSupport?.length ? (
                <div>
                  <div className="text-sm font-medium">Apoyo visual</div>
                  <div className="mt-1 text-sm muted">{step.visualSupport.join(", ")}</div>
                </div>
              ) : null}

              {step.sensoryNotes?.length ? (
                <div>
                  <div className="text-sm font-medium">Notas sensoriales</div>
                  <ul className="mt-2 list-disc ml-5 text-sm muted space-y-1">
                    {step.sensoryNotes.map((n, idx) => (
                      <li key={idx}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {step.backupPlan?.length ? (
                <div>
                  <div className="text-sm font-medium">Plan B</div>
                  <ul className="mt-2 list-disc ml-5 text-sm muted space-y-1">
                    {step.backupPlan.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <div className="text-xs muted mb-2">Feedback</div>
          <Segment value={outcome} onChange={onFeedback} />
        </div>
      </div>
    </div>
  );
}

export default function RoutinesPage() {
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);

  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [feedback, setFeedbackState] = useState<Feedback[]>([]);

  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setProfile(loadProfile());
    setRoutine(loadLastRoutine());
    setDoneIds(loadChecklist());
    setFeedbackState(loadFeedback());
  }, []);

  const allSteps = useMemo(() => {
    const steps: RoutineStep[] = [];
    if (!routine) return steps;
    for (const b of routine.blocks) steps.push(...b.steps);
    return steps;
  }, [routine]);

  const progress = useMemo(() => {
    if (!allSteps.length) return 0;
    const doneCount = allSteps.filter((s) => doneIds.includes(s.id)).length;
    return Math.round((doneCount / allSteps.length) * 100);
  }, [allSteps, doneIds]);

  const feedbackMap = useMemo(() => {
    const map = new Map<string, Feedback["outcome"]>();
    for (const f of feedback) map.set(f.stepId, f.outcome);
    return map;
  }, [feedback]);

  async function generate() {
    if (!profile) {
      setStatus("No hay perfil guardado. Ve a Perfil y guárdalo.");
      setTimeout(() => setStatus(""), 1500);
      return;
    }

    setStatus("Generando rutina…");
    clearSessionData();
    setDoneIds([]);
    setFeedbackState([]);

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
    setTimeout(() => setStatus(""), 1000);
  }

  async function refine() {
    if (!routine) return;

    const hasSignal = feedback.some((f) => f.outcome !== "ok");
    if (!hasSignal) {
      setStatus("Marca al menos un paso como Difícil o Falló para refinar.");
      setTimeout(() => setStatus(""), 1500);
      return;
    }

    setStatus("Refinando con feedback…");

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
    setTimeout(() => setStatus(""), 1000);
  }

  function toggleDone(stepId: string) {
    setDoneIds((prev) => {
      const next = prev.includes(stepId) ? prev.filter((x) => x !== stepId) : [...prev, stepId];
      saveChecklist(next);
      return next;
    });
  }

  function setOutcome(stepId: string, outcome: Feedback["outcome"]) {
    setFeedbackState((prev) => {
      const next = prev.filter((x) => x.stepId !== stepId);
      next.push({ routineId: "local", stepId, outcome });
      saveFeedback(next);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Rutina</h1>
            <p className="muted mt-1">
              Checklist del día + feedback. Generación por reglas explicable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={generate}>
              Generar
            </button>
            <button className="btn-primary" onClick={refine} disabled={!routine}>
              Refinar con feedback
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="card p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Progreso del día</div>
              <div className="text-sm font-semibold">{progress}%</div>
            </div>
            <div className="mt-3">
              <ProgressBar value={progress} />
            </div>
            <div className="mt-2 text-xs muted">
              Marca pasos completados para que la rutina se sienta operativa.
            </div>
          </div>

          <div className="card p-4">
            <div className="text-sm font-medium">Perfil</div>
            {!profile ? (
              <div className="mt-2 text-sm muted">No hay perfil guardado.</div>
            ) : (
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between"><span className="muted">Edad</span><span className="font-medium">{profile.age}</span></div>
                <div className="flex justify-between"><span className="muted">Contexto</span><span className="font-medium">{profile.context}</span></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile.sensorySensitivity.length ? profile.sensorySensitivity : ["—"]).map((x) => (
                    <Chip key={x}>{x}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {status ? <div className="mt-4 text-sm">{status}</div> : null}
      </section>

      {!routine ? (
        <section className="card p-6">
          <div className="font-semibold">Sin rutina todavía</div>
          <p className="muted mt-1 text-sm">
            Genera una rutina para verla aquí. Si ya guardaste el perfil, el botón “Generar” es suficiente.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="card p-6">
            <div className="text-lg font-semibold">{routine.title}</div>
            <div className="muted mt-1 text-sm">Objetivo: <span className="text-neutral-900">{routine.goal}</span></div>

            <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
              <div className="card p-4">
                <div className="font-medium">Plan de cambios</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.changePlan.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="card p-4">
                <div className="font-medium">Señales de sobrecarga</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.overloadSignals.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="card p-4">
                <div className="font-medium">Notas cuidador</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.caregiverNotes.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {routine.blocks.map((b) => (
            <details key={b.label} className="card p-0 overflow-hidden" open>
              <summary className="cursor-pointer select-none px-6 py-4 flex items-center justify-between">
                <div className="font-semibold">{labelBlock(b.label)}</div>
                <div className="text-sm muted">
                  {b.steps.filter((s) => doneIds.includes(s.id)).length}/{b.steps.length} completados
                </div>
              </summary>

              <div className="px-6 pb-6 space-y-3">
                {b.steps.map((s) => {
                  const outcome = feedbackMap.get(s.id) ?? "none";
                  return (
                    <StepCard
                      key={s.id}
                      step={s}
                      done={doneIds.includes(s.id)}
                      outcome={outcome}
                      onToggleDone={() => toggleDone(s.id)}
                      onFeedback={(v) => setOutcome(s.id, v)}
                    />
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
