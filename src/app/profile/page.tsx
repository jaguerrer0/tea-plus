"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProfileInput, Sensory } from "@/lib/types";
import { loadProfile, saveProfile } from "@/lib/storage";

const SENSORY_OPTIONS: { key: Sensory; label: string; desc: string }[] = [
  { key: "sound", label: "Sonido", desc: "Ruido, TV, voces, ambientes ruidosos." },
  { key: "light", label: "Luz", desc: "Luz fuerte, reflejos, fluorescentes." },
  { key: "touch", label: "Tacto", desc: "Texturas, etiquetas, ropa, contacto." },
  { key: "crowds", label: "Multitudes", desc: "Gente, filas, espacios concurridos." },
];

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-1">
      <div className="text-sm font-medium">{title}</div>
      {hint ? (
        <div className="text-xs text-neutral-600 dark:text-neutral-400">{hint}</div>
      ) : null}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileInput>({
    age: 8,
    communicationLevel: "verbal",
    sensorySensitivity: ["sound"],
    goal: "Rutina matutina para ir a la escuela",
    context: "home",
  });

  const [saved, setSaved] = useState(false);

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
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
        <h1 className="text-xl font-semibold">Perfil</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Información mínima para generar rutinas explicables y adaptables.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
          <FieldLabel title="Edad" hint="Ajusta duración de pasos automáticamente." />
          <input
            type="number"
            min={2}
            max={99}
            value={profile.age}
            onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))}
            className="w-full rounded-xl border px-3 py-2 bg-transparent"
          />

          <div className="mt-4">
            <FieldLabel title="Nivel de comunicación" />
            <select
              value={profile.communicationLevel}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  communicationLevel: e.target.value as ProfileInput["communicationLevel"],
                }))
              }
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
            >
              <option value="verbal">Verbal</option>
              <option value="semi-verbal">Semi-verbal</option>
              <option value="non-verbal">No verbal</option>
            </select>
          </div>

          <div className="mt-4">
            <FieldLabel title="Contexto principal" />
            <select
              value={profile.context}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  context: e.target.value as ProfileInput["context"],
                }))
              }
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
            >
              <option value="home">Casa</option>
              <option value="school">Escuela</option>
              <option value="mixed">Mixto</option>
            </select>
          </div>

          <div className="mt-4">
            <FieldLabel title="Objetivo de rutina" hint="Ej: “Rutina matutina para ir a la escuela”" />
            <input
              value={profile.goal}
              onChange={(e) => setProfile((p) => ({ ...p, goal: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onSave}
              className="rounded-xl px-4 py-2 border bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              Guardar perfil
            </button>
            {saved ? <span className="text-sm">Guardado</span> : null}
          </div>
        </div>

        <div className="rounded-2xl border p-6 bg-white dark:bg-neutral-950">
          <FieldLabel
            title="Sensibilidades sensoriales"
            hint="Esto agrega notas para reducir sobrecarga y planes B."
          />
          <div className="space-y-3">
            {SENSORY_OPTIONS.map((s) => {
              const active = sensorySet.has(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSensory(s.key)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-transparent"
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className={`text-sm ${active ? "opacity-90" : "text-neutral-600 dark:text-neutral-400"}`}>
                    {s.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
