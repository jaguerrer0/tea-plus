"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Reminder } from "@/lib/types";
import { deleteReminder, loadReminders, saveReminders, upsertReminder } from "@/lib/reminders-storage";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function fmt(dtISO: string) {
  const d = new Date(dtISO);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function RemindersPage() {
  const [list, setList] = useState<Reminder[]>([]);
  const [status, setStatus] = useState<string>("");
  const [alert, setAlert] = useState<string>("");

  // Evita disparar múltiples veces el mismo recordatorio en la misma sesión
  const firedRef = useRef(new Set<string>());

  const [form, setForm] = useState<{
    title: string;
    kind: Reminder["kind"];
    datetimeLocal: string;
    repeat: Reminder["repeat"];
    notes: string;
  }>({
    title: "",
    kind: "custom",
    datetimeLocal: "",
    repeat: "none",
    notes: "",
  });

  useEffect(() => {
    setList(loadReminders());
  }, []);

  // Scheduler in-app (sin push). Revisa cada 20s.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      const current = loadReminders().filter((r) => r.enabled);

      for (const r of current) {
        if (firedRef.current.has(r.id)) continue;

        const due = new Date(r.datetimeISO).getTime();
        if (Number.isNaN(due)) continue;

        // ventana de disparo: ya venció (<= ahora)
        if (due <= now) {
          setAlert(`${r.title} (${r.kind})`);
          firedRef.current.add(r.id);

          // Si es repetible, mueve su próxima fecha; si no, lo deshabilita.
          if (r.repeat === "daily") {
            const next = { ...r, datetimeISO: addDays(r.datetimeISO, 1) };
            upsertReminder(next);
          } else if (r.repeat === "weekly") {
            const next = { ...r, datetimeISO: addDays(r.datetimeISO, 7) };
            upsertReminder(next);
          } else {
            const next = { ...r, enabled: false };
            upsertReminder(next);
          }

          setList(loadReminders());
        }
      }
    }, 20000);

    return () => clearInterval(t);
  }, []);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => a.datetimeISO.localeCompare(b.datetimeISO));
  }, [list]);

  function addReminder() {
    if (form.title.trim().length < 2) {
      setStatus("Escribe un título.");
      setTimeout(() => setStatus(""), 1200);
      return;
    }
    if (!form.datetimeLocal) {
      setStatus("Selecciona fecha y hora.");
      setTimeout(() => setStatus(""), 1200);
      return;
    }

    const iso = new Date(form.datetimeLocal).toISOString();

    const r: Reminder = {
      id: uid("rem"),
      title: form.title.trim(),
      kind: form.kind,
      datetimeISO: iso,
      repeat: form.repeat,
      notes: form.notes.trim() || undefined,
      enabled: true,
    };

    const next = [...list, r];
    setList(next);
    saveReminders(next);

    setForm({ title: "", kind: "custom", datetimeLocal: "", repeat: "none", notes: "" });
    setStatus("Recordatorio agregado.");
    setTimeout(() => setStatus(""), 1000);
  }

  function toggleEnabled(id: string) {
    const next = list.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x));
    setList(next);
    saveReminders(next);
    firedRef.current.delete(id);
  }

  function remove(id: string) {
    deleteReminder(id);
    setList(loadReminders());
    firedRef.current.delete(id);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Recordatorios</h1>
            <p className="muted mt-1">
              Medicación, terapias y citas. MVP in-app (sin notificaciones push).
            </p>
          </div>
        </div>

        {alert ? (
          <div className="mt-4 card p-4" style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.06)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">Recordatorio</div>
                <div className="muted text-sm mt-1">{alert}</div>
              </div>
              <button className="btn-primary" onClick={() => setAlert("")}>Entendido</button>
            </div>
          </div>
        ) : null}

        {status ? <div className="mt-3 text-sm">{status}</div> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <div className="font-semibold">Lista</div>
          <div className="mt-4 space-y-3">
            {!sorted.length ? (
              <div className="text-sm muted">No hay recordatorios.</div>
            ) : (
              sorted.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="muted text-sm mt-1">{fmt(r.datetimeISO)} · {r.kind} · {r.repeat}</div>
                      {r.notes ? <div className="muted text-sm mt-2">{r.notes}</div> : null}
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <span className="chip">{r.enabled ? "Activo" : "Pausado"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn-secondary" onClick={() => toggleEnabled(r.id)}>
                        {r.enabled ? "Pausar" : "Activar"}
                      </button>
                      <button className="btn-secondary" onClick={() => remove(r.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="card p-6">
          <div className="font-semibold">Agregar</div>
          <div className="muted text-sm mt-1">Sugerencia: usa repetición diaria para medicación.</div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-medium">Título</div>
              <input className="input mt-2" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Medicamento A" />
            </div>

            <div>
              <div className="text-sm font-medium">Tipo</div>
              <select className="input mt-2" value={form.kind} onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as any }))}>
                <option value="medication">Medicación</option>
                <option value="therapy">Terapia</option>
                <option value="appointment">Cita</option>
                <option value="custom">Otro</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-medium">Fecha y hora</div>
              <input className="input mt-2" type="datetime-local" value={form.datetimeLocal} onChange={(e) => setForm((p) => ({ ...p, datetimeLocal: e.target.value }))} />
            </div>

            <div>
              <div className="text-sm font-medium">Repetición</div>
              <select className="input mt-2" value={form.repeat} onChange={(e) => setForm((p) => ({ ...p, repeat: e.target.value as any }))}>
                <option value="none">No repetir</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-medium">Notas (opcional)</div>
              <textarea className="input mt-2" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Dosis, instrucciones..." />
            </div>

            <button className="btn-primary w-full" onClick={addReminder}>
              Agregar
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
