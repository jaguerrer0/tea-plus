"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Feedback, PlannedEvent, ProfileInput, Routine, RoutineStep } from "@/lib/types";
import {
  clearSessionData,
  loadChecklist,
  loadFeedback,
  loadLastRoutine,
  loadProfile,
  saveChecklist,
  saveFeedback,
  saveLastRoutine,
  getTodayKey,
} from "@/lib/storage";
import { saveDailyStats } from "@/lib/stats-storage";
import { blobToObjectUrl, saveBlob } from "@/lib/media-db";

import { loadEvents } from "@/lib/calendar-storage";

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
  const base = "px-3 py-2 text-xs font-medium rounded-xl border transition select-none";
  const activeStyle = (v: string) => (value === v ? "border-transparent text-white" : "bg-white");
  const activeBg = (v: string) =>
    value === v ? { background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(99,102,241,0.78))" } : undefined;

  return (
    <div className="flex items-center gap-2">
      <button className={`${base} ${activeStyle("ok")}`} style={activeBg("ok")} onClick={() => onChange("ok")}>
        OK
      </button>
      <button className={`${base} ${activeStyle("hard")}`} style={activeBg("hard")} onClick={() => onChange("hard")}>
        Difícil
      </button>
      <button
        className={`${base} ${activeStyle("failed")}`}
        style={activeBg("failed")}
        onClick={() => onChange("failed")}
      >
        Falló
      </button>
    </div>
  );
}

function StepAccordionItem({
  step,
  done,
  outcome,
  onToggleDone,
  onFeedback,
  onAddVisualAsset,
  disableToggle,
}: {
  step: RoutineStep;
  done: boolean;
  outcome: Feedback["outcome"] | "none";
  onToggleDone: () => void;
  onFeedback: (v: Feedback["outcome"]) => void;
  onAddVisualAsset: (src: string, type: "pictogram" | "photo", label?: string) => void;
  disableToggle?: boolean;
}) {
  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const a of step.visualAssets ?? []) {
        if (a.src?.startsWith("idb:")) {
          const id = a.src.slice(4);
          const url = await blobToObjectUrl(id);
          if (url) next[a.src] = url;
        }
      }
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [step.visualAssets]);
  const [assetSrc, setAssetSrc] = useState("");
  const [assetType, setAssetType] = useState<"pictogram" | "photo">("pictogram");
  const [assetLabel, setAssetLabel] = useState("");

  return (
    <details className="card overflow-hidden">
      <summary className="cursor-pointer select-none px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!disableToggle) onToggleDone();
            }}
            className="h-6 w-6 rounded-lg border flex items-center justify-center shrink-0"
            style={
              done
                ? { background: "rgb(16 185 129 / 0.12)", borderColor: "rgb(16 185 129 / 0.35)" }
                : undefined
            }
            aria-label="Marcar como completado"
            title={disableToggle ? "Día completado (reinicia para modificar)" : "Marcar como completado"}
            disabled={disableToggle}
          >
            {done ? "✓" : ""}
          </button>

          <div className="min-w-0">
            <div className="font-semibold truncate">{step.title}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="chip">{step.durationMin} min</span>
              {step.visualSupport?.length ? <span className="chip">Apoyo visual</span> : null}
              {step.sensoryNotes?.length ? <span className="chip">Sensorial</span> : null}
              {step.backupPlan?.length ? <span className="chip">Plan B</span> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block">
            <div className="text-xs muted mb-1 text-right">Feedback</div>
            <Segment value={outcome} onChange={onFeedback} />
          </div>

          <span className="chip chev" aria-hidden>
            ▼
          </span>
        </div>
      </summary>

      <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "rgb(var(--border))" }}>
        <div className="md:hidden flex items-center justify-between gap-3 mb-4">
          <div className="text-xs muted">Feedback</div>
          <Segment value={outcome} onChange={onFeedback} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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

            <div>
              <div className="text-sm font-medium">Pictogramas / fotos</div>
              {step.visualAssets?.length ? (
                <div className="mt-2 grid gap-2 grid-cols-2">
                  {step.visualAssets.map((a, i) => (
                    <div key={i} className="card p-2">
                      <img
                        src={a.src.startsWith("idb:") ? (resolved[a.src] ?? "") : a.src}
                        alt={a.label ?? a.type}
                        className="rounded-xl border"
                      />
                      {a.label ? <div className="text-xs muted mt-1">{a.label}</div> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-sm muted">Sin pictogramas/fotos aún.</div>
              )}

              <div className="mt-3 grid gap-2">
                <div className="grid gap-2 md:grid-cols-3">
                  <select className="input" value={assetType} onChange={(e) => setAssetType(e.target.value as any)}>
                    <option value="pictogram">Pictograma</option>
                    <option value="photo">Foto</option>
                  </select>
                  <input className="input" value={assetLabel} onChange={(e) => setAssetLabel(e.target.value)} placeholder="Etiqueta (opcional)" maxLength={40} />
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const src = assetSrc.trim();
                      if (!src) return;
                      onAddVisualAsset(src, assetType, assetLabel.trim() || undefined);
                      setAssetSrc("");
                      setAssetLabel("");
                    }}
                  >
                    Agregar
                  </button>
                </div>
                <input className="input" value={assetSrc} onChange={(e) => setAssetSrc(e.target.value)} placeholder="URL o dataURL (pictograma/foto)" />

                <div className="mt-2">
                  <div className="text-xs muted">O subir imagen (se guarda offline como en Familia)</div>
                  <input
                    className="input mt-2"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const id = await saveBlob(f);
                      onAddVisualAsset(`idb:${id}`, assetType, assetLabel.trim() || undefined);
                      setAssetLabel("");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>

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
    </details>
  );
}

export default function RoutinesPage() {
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [activeBlock, setActiveBlock] = useState<"morning" | "afternoon" | "evening">("morning");

  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [feedback, setFeedbackState] = useState<Feedback[]>([]);
  const [status, setStatus] = useState<string>("");
  const [events, setEvents] = useState<PlannedEvent[]>([]);

  // Día actual (para leer/guardar checklist+feedback por fecha)
  const dayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    setProfile(loadProfile());
    const r = loadLastRoutine();
    setRoutine(r);

    // Carga checklist/feedback del día actual
    setDoneIds(loadChecklist(dayKey));
    setFeedbackState(loadFeedback(dayKey));

    // Eventos del día (anticipación)
    setEvents(loadEvents(dayKey));

    if (r?.blocks?.length) setActiveBlock(r.blocks[0].label as any);
  }, [dayKey]);

  const allSteps = useMemo(() => {
    if (!routine) return [];
    return routine.blocks.flatMap((b) => b.steps);
  }, [routine]);

  const progress = useMemo(() => {
    if (!allSteps.length) return 0;
    const doneCount = allSteps.filter((s) => doneIds.includes(s.id)).length;
    return Math.round((doneCount / allSteps.length) * 100);
  }, [allSteps, doneIds]);

  const isDayComplete = useMemo(() => {
    if (!allSteps.length) return false;
    return allSteps.every((s) => doneIds.includes(s.id));
  }, [allSteps, doneIds]);

  useEffect(() => {
    if (isDayComplete && routine) {
      setStatus("Día completado. Cierra el día o inicia uno nuevo.");
    }
  }, [isDayComplete, routine]);

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

    // Limpia sesión del día (checklist+feedback)
    clearSessionData(dayKey);
    setDoneIds([]);
    setFeedbackState([]);
    setActiveBlock("morning");

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

  // ✅ Toggle sin estado stale + auto-avance correcto (solo si estás marcando como done)
  function toggleDone(stepId: string, blockLabel?: "morning" | "afternoon" | "evening") {
    setDoneIds((prev) => {
      const isCurrentlyDone = prev.includes(stepId);
      const next = isCurrentlyDone ? prev.filter((x) => x !== stepId) : [...prev, stepId];

      saveChecklist(next, dayKey);

      // Auto-avance: solo cuando el usuario MARCA como done (no cuando desmarca)
      if (!isCurrentlyDone && routine && blockLabel) {
        const block = routine.blocks.find((b) => b.label === blockLabel);
        if (block) {
          const completedBlock = block.steps.every((s) => next.includes(s.id));
          if (completedBlock) {
            const order: Array<"morning" | "afternoon" | "evening"> = ["morning", "afternoon", "evening"];
            const idx = order.indexOf(blockLabel);
            const nextBlock = order[Math.min(idx + 1, order.length - 1)];
            setActiveBlock(nextBlock);
          }
        }
      }

      return next;
    });
  }

  function setOutcome(stepId: string, outcome: Feedback["outcome"]) {
    setFeedbackState((prev) => {
      const next = prev.filter((x) => x.stepId !== stepId);
      next.push({ routineId: "local", stepId, outcome });
      saveFeedback(next, dayKey);
      return next;
    });
  }

  function addVisualAsset(stepId: string, src: string, type: "pictogram" | "photo", label?: string) {
    if (!routine) return;
    const next: Routine = {
      ...routine,
      blocks: routine.blocks.map((b) => ({
        ...b,
        steps: b.steps.map((s) => {
          if (s.id !== stepId) return s;
          const current = s.visualAssets ?? [];
          return {
            ...s,
            visualAssets: [...current, { type, src, label }],
          };
        }),
      })),
    };

    setRoutine(next);
    saveLastRoutine(next);
  }

  function closeDayResetChecklist() {
    // Guardar estadísticas operativas (no diagnóstico)
    const total = allSteps.length;
    const done = allSteps.filter((s) => doneIds.includes(s.id)).length;
    const hardCount = feedback.filter((f) => f.outcome === "hard").length;
    const failedCount = feedback.filter((f) => f.outcome === "failed").length;

    if (total > 0) {
      saveDailyStats({
        day: dayKey,
        totalSteps: total,
        doneSteps: done,
        completionPct: Math.round((done / total) * 100),
        hardCount,
        failedCount,
        createdAtISO: new Date().toISOString(),
      });
    }

    clearSessionData(dayKey);
    setDoneIds([]);
    setFeedbackState([]);
    setActiveBlock("morning");
    setStatus("Día cerrado. Checklist reiniciado.");
    setTimeout(() => setStatus(""), 1200);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Rutina</h1>
            <p className="muted mt-1">Checklist del día + feedback. Generación por reglas explicable.</p>
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
            <div className="mt-2 text-xs muted">Marca pasos completados para que la rutina se sienta operativa.</div>
          </div>

          <div className="card p-4">
            <div className="text-sm font-medium">Perfil</div>
            {!profile ? (
              <div className="mt-2 text-sm muted">No hay perfil guardado.</div>
            ) : (
              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="muted">Edad</span>
                  <span className="font-medium">{profile.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="muted">Contexto</span>
                  <span className="font-medium">{profile.context}</span>
                </div>
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
          {/* ✅ Banner de “Día completado” con acciones claras */}
          {isDayComplete ? (
            <section className="card p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-lg font-semibold">Día completado ✅</div>
                  <div className="muted text-sm mt-1">
                    Cierra el día para reiniciar checklist/feedback o genera una nueva rutina.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={closeDayResetChecklist}>
                    Cerrar día (reiniciar checklist)
                  </button>
                  <button className="btn-primary" onClick={generate}>
                    Nuevo día (generar)
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <div className="card p-6">
            <div className="text-lg font-semibold">{routine.title}</div>
            <div className="muted mt-1 text-sm">
              Objetivo: <span className="text-neutral-900">{routine.goal}</span>
            </div>

            {events.length ? (
              <div className="mt-4 card p-4" style={{ borderColor: "rgba(99,102,241,0.30)", background: "rgba(99,102,241,0.06)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium">Hoy (anticipación)</div>
                    <div className="muted text-sm mt-1">
                      Eventos programados para {dayKey}. Útil para preparar transiciones.
                    </div>
                  </div>
                  <Link href="/calendar" className="btn-secondary">
                    Abrir calendario
                  </Link>
                </div>

                <div className="mt-3 grid gap-2">
                  {events
                    .slice()
                    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
                    .map((ev) => (
                      <div key={ev.id} className="card p-4">
                        <div className="font-medium">
                          {ev.time ? `${ev.time} · ` : ""}
                          {ev.title}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ev.category ? <span className="chip">{ev.category}</span> : null}
                          {ev.location ? <span className="chip">{ev.location}</span> : null}
                          {ev.pictogramSrc ? <span className="chip">Pictograma</span> : null}
                        </div>
                        {ev.preparation?.length ? (
                          <ul className="mt-3 list-disc ml-5 text-sm muted space-y-1">
                            {ev.preparation.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm muted">
                No hay eventos previsorios para hoy. Puedes agregar terapias/salidas en <Link href="/calendar" className="underline">Calendario</Link>.
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
              <div className="card p-4">
                <div className="font-medium">Plan de cambios</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.changePlan.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <div className="font-medium">Señales de sobrecarga</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.overloadSignals.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <div className="font-medium">Notas cuidador</div>
                <ul className="mt-2 list-disc ml-5 muted space-y-1">
                  {routine.caregiverNotes.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-2">
              {routine.blocks.map((b) => {
                const isActive = activeBlock === (b.label as any);
                const doneCount = b.steps.filter((s) => doneIds.includes(s.id)).length;

                return (
                  <button
                    key={b.label}
                    className={isActive ? "btn-primary" : "btn-secondary"}
                    onClick={() => setActiveBlock(b.label as any)}
                  >
                    {labelBlock(b.label)} ({doneCount}/{b.steps.length})
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-sm muted">Tip: completa un bloque y pasa al siguiente.</div>
          </div>

          {/* Bloque activo */}
          {routine.blocks
            .filter((b) => b.label === activeBlock)
            .map((b) => (
              <section key={b.label} className="space-y-3">
                <div className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{labelBlock(b.label)}</div>
                    <div className="text-sm muted">
                      {b.steps.filter((s) => doneIds.includes(s.id)).length}/{b.steps.length} completados
                    </div>
                  </div>
                </div>

                {b.steps.map((s) => {
                  const outcome = feedbackMap.get(s.id) ?? "none";
                  return (
                    <StepAccordionItem
                      key={s.id}
                      step={s}
                      done={doneIds.includes(s.id)}
                      outcome={outcome}
                      // Si ya está completo el día, puedes decidir bloquear toggles (o permitirlos).
                      // Aquí lo bloqueo para evitar estados raros: el usuario usa “Cerrar día”.
                      disableToggle={isDayComplete}
                      onToggleDone={() => toggleDone(s.id, b.label as any)}
                      onFeedback={(v) => setOutcome(s.id, v)}
                      onAddVisualAsset={(src, type, label) => addVisualAsset(s.id, src, type, label)}
                    />
                  );
                })}
              </section>
            ))}
        </section>
      )}
    </div>
  );
}
