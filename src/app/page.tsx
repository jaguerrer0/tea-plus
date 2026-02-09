"use client";

import { useState } from "react";
import type { Routine } from "@/lib/types";

export default function Home() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [raw, setRaw] = useState<string>("");

  async function generate() {
    const res = await fetch("/api/routines/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: 8,
        communicationLevel: "verbal",
        sensorySensitivity: ["sound"],
        goal: "Rutina matutina para ir a la escuela",
        context: "home",
      }),
    });

    const data = await res.json();
    setRaw(JSON.stringify(data, null, 2));
    if (res.ok) setRoutine(data.routine);
  }

  return (
    <main className="p-6 space-y-6">
      <button
        onClick={generate}
        className="rounded px-4 py-2 border"
      >
        Generar rutina (IA por reglas)
      </button>

      {routine && (
        <section className="space-y-4">
          <h1 className="text-xl font-semibold">{routine.title}</h1>
          <p><b>Objetivo:</b> {routine.goal}</p>

          {routine.blocks.map((b) => (
            <div key={b.label} className="border rounded p-4">
              <h2 className="font-semibold">{b.label}</h2>
              <ol className="list-decimal ml-5 space-y-2">
                {b.steps.map((s) => (
                  <li key={s.id}>
                    <div className="font-medium">{s.title} ({s.durationMin} min)</div>
                    <ul className="list-disc ml-5">
                      {s.instructions.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      <pre className="text-xs border rounded p-4 overflow-auto">{raw}</pre>
    </main>
  );
}
