"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProfileInput, Sensory, RoutineFocus } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";


const SENSORY: { key: Sensory; title: string; desc: string }[] = [
  { key: "sound", title: "Sonido", desc: "Ruido, voces, TV." },
  { key: "light", title: "Luz", desc: "Luz fuerte, reflejos." },
  { key: "touch", title: "Tacto", desc: "Texturas, etiquetas." },
  { key: "crowds", title: "Multitudes", desc: "Filas, lugares llenos." },
];

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`chip ${active ? "border-transparent" : ""}`}
      style={
  active
    ? { background: "rgb(99 102 241 / 0.10)", borderColor: "rgb(99 102 241 / 0.25)" }
    : undefined
}
    >
      {label}
    </div>
  );
}

export default function ProfilePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saved, setSaved] = useState(false);
  const router = useRouter();


  const [profile, setProfile] = useState<ProfileInput>({
    name: "",
    age: 8,
    communicationLevel: "verbal",
    sensorySensitivity: [],
    supportLevel: undefined,
    routineFocus: "full-day",
    goal: "Rutina matutina para ir a la escuela",
    context: "home",
  });

  function autoFocus(goal: string): RoutineFocus {
    const g = goal.toLowerCase();
    if (g.includes("dorm") || g.includes("noche")) return "evening";
    if (g.includes("matut") || g.includes("mañ")) return "morning";
    if (g.includes("tarde") || g.includes("regresar")) return "afternoon";
    return "full-day";
  }

  useEffect(() => {
    const existing = loadProfile();
    if (existing) setProfile(existing);
  }, []);

  const sensorySet = useMemo(() => new Set(profile.sensorySensitivity), [profile.sensorySensitivity]);

  function toggleSensory(s: Sensory) {
    const next = new Set(sensorySet);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setProfile((p) => ({ ...p, sensorySensitivity: Array.from(next) as Sensory[] }));
  }

  function onSave() {
  saveProfile(profile);
  setSaved(true);

  setTimeout(() => {
    setSaved(false);
    router.push("/routines");
  }, 900);
}


  const canNext =
    (step === 1 && profile.age >= 2) ||
    (step === 2 && profile.goal.trim().length >= 5) ||
    step === 3;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Perfil</h1>
            <p className="muted mt-1">
              Configura lo mínimo necesario. La app genera una rutina explicable y ajustable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StepPill active={step === 1} label="1) Persona" />
            <StepPill active={step === 2} label="2) Objetivo" />
            <StepPill active={step === 3} label="3) Sensibilidades" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Nombre (opcional)</div>
                <div className="muted text-xs">Solo un nombre para personalizar la rutina.</div>
                <input
                  className="input mt-2"
                  value={profile.name ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Juan"
                  maxLength={40}
                />
              </div>

              <div>
                <div className="text-sm font-medium">Edad</div>
                <div className="muted text-xs">Ajusta duración y granularidad de pasos.</div>
                <input
                  className="input mt-2"
                  type="number"
                  min={2}
                  max={99}
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium">Comunicación</div>
                  <div className="muted text-xs">Define apoyos visuales sugeridos.</div>
                  <select
                    className="input mt-2"
                    value={profile.communicationLevel}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        communicationLevel: e.target.value as ProfileInput["communicationLevel"],
                      }))
                    }
                  >
                    <option value="verbal">Verbal</option>
                    <option value="semi-verbal">Semi-verbal</option>
                    <option value="non-verbal">No verbal</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm font-medium">Contexto</div>
                  <div className="muted text-xs">Ajusta pasos de transición/salida.</div>
                  <select
                    className="input mt-2"
                    value={profile.context}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        context: e.target.value as ProfileInput["context"],
                      }))
                    }
                  >
                    <option value="home">Casa</option>
                    <option value="school">Escuela</option>
                    <option value="mixed">Mixto</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm font-medium">Nivel de apoyo (opcional)</div>
                  <div className="muted text-xs">
                    Ajusta granularidad y apoyos (no es diagnóstico).
                  </div>
                  <select
                    className="input mt-2"
                    value={profile.supportLevel ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        supportLevel: (e.target.value || undefined) as ProfileInput["supportLevel"],
                      }))
                    }
                  >
                    <option value="">—</option>
                    <option value="low">Bajo</option>
                    <option value="moderate">Moderado</option>
                    <option value="high">Alto</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Objetivo</div>
                <div className="muted text-xs">Describe la rutina que quieres (corta y concreta).</div>
                <input
                  className="input mt-2"
                  value={profile.goal}
                  onChange={(e) => setProfile((p) => ({ ...p, goal: e.target.value }))}
                  placeholder="Ej: Rutina matutina para ir a la escuela"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="text-sm font-medium">Enfoque</div>
                  <div className="muted text-xs">Define qué bloque generar (opcional).</div>
                  <select
                    className="input mt-2"
                    value={profile.routineFocus ?? "full-day"}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, routineFocus: e.target.value as any }))
                    }
                  >
                    <option value="full-day">Día completo</option>
                    <option value="morning">Solo mañana</option>
                    <option value="afternoon">Solo tarde</option>
                    <option value="evening">Solo noche</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    className="btn-secondary w-full"
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, routineFocus: autoFocus(p.goal) }))}
                  >
                    Auto por objetivo
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "Rutina matutina para ir a la escuela",
                  "Rutina de tarde al regresar a casa",
                  "Rutina nocturna para dormir",
                  "Rutina para transición (salida a lugar nuevo)",
                ].map((x) => (
                  <button key={x} className="btn-secondary text-left" onClick={() => setProfile((p) => ({ ...p, goal: x }))}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Sensibilidades</div>
                <div className="muted text-xs">Se agregan notas sensoriales y planes B por paso.</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {SENSORY.map((s) => {
                  const active = sensorySet.has(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => toggleSensory(s.key)}
                      className="card p-4 text-left transition"
                      style={
                        active
                          ? { borderColor: "rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.06)" }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s.title}</div>
                        <span className="chip">{active ? "Activo" : "Opcional"}</span>
                      </div>
                      <div className="muted text-sm mt-1">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              className="btn-secondary"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as any)))}
              disabled={step === 1}
            >
              Atrás
            </button>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  className="btn-primary"
                  disabled={!canNext}
                  onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as any)))}
                >
                  Siguiente
                </button>
              ) : (
                <button className="btn-primary" onClick={onSave}>
                  Guardar perfil
                </button>
              )}

              {saved ? (
  <span className="chip" style={{ borderColor: "rgb(var(--brand) / 0.35)", background: "rgb(var(--brand) / 0.10)" }}>
    Perfil guardado ✓
  </span>
) : null}

            </div>
          </div>
        </div>

        <aside className="card p-6">
          <div className="font-semibold">Vista previa</div>
          <div className="muted text-sm mt-1">Así se usará para generar la rutina.</div>

          <div className="mt-4 space-y-3 text-sm">
            {profile.name?.trim() ? (
              <div className="flex items-center justify-between"><span className="muted">Nombre</span><span className="font-medium">{profile.name.trim()}</span></div>
            ) : null}
            <div className="flex items-center justify-between"><span className="muted">Edad</span><span className="font-medium">{profile.age}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Comunicación</span><span className="font-medium">{profile.communicationLevel}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Contexto</span><span className="font-medium">{profile.context}</span></div>
            {profile.supportLevel ? (
              <div className="flex items-center justify-between"><span className="muted">Apoyo</span><span className="font-medium">{profile.supportLevel}</span></div>
            ) : null}
            <div>
              <div className="muted">Objetivo</div>
              <div className="font-medium mt-1">{profile.goal}</div>
            </div>
            <div>
              <div className="muted">Sensibilidades</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile.sensorySensitivity.length ? profile.sensorySensitivity : ["—"]).map((x) => (
                  <span key={x} className="chip">{x}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
