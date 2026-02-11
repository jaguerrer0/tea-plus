"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlannedEvent } from "@/lib/types";
import { getTodayKey } from "@/lib/storage";
import { deleteEvent, loadEvents, saveEvents } from "@/lib/calendar-storage";
import { blobToObjectUrl, saveBlob } from "@/lib/media-db";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

const CATEGORIES: Array<{ value: PlannedEvent["category"]; label: string }> = [
  { value: "therapy", label: "Terapia" },
  { value: "school", label: "Escuela" },
  { value: "family", label: "Familia" },
  { value: "outing", label: "Salida" },
  { value: "medication", label: "Medicación" },
  { value: "custom", label: "Otro" },
];

export default function CalendarPage() {
  const [day, setDay] = useState(getTodayKey());
  const [list, setList] = useState<PlannedEvent[]>([]);
  const [status, setStatus] = useState<string>("");
  const [pictos, setPictos] = useState<Record<string, string>>({});

  const [form, setForm] = useState<{
    time: string;
    title: string;
    category: NonNullable<PlannedEvent["category"]>;
    location: string;
    preparation: string;
    pictogramSrc: string;
  }>({
    time: "",
    title: "",
    category: "custom",
    location: "",
    preparation: "",
    pictogramSrc: "",
  });

  useEffect(() => {
    setList(loadEvents(day));
  }, [day]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const ev of list) {
        if (ev.pictogramSrc?.startsWith("idb:")) {
          const id = ev.pictogramSrc.slice(4);
          const url = await blobToObjectUrl(id);
          if (url) map[ev.pictogramSrc] = url;
        }
      }
      if (!cancelled) setPictos(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [list]);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [list]);

  function addEvent() {
    if (form.title.trim().length < 2) {
      setStatus("Escribe un título.");
      setTimeout(() => setStatus(""), 1200);
      return;
    }

    const ev: PlannedEvent = {
      id: uid("ev"),
      date: day,
      time: form.time || undefined,
      title: form.title.trim(),
      category: form.category,
      location: form.location.trim() || undefined,
      preparation: form.preparation.trim()
        ? form.preparation
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)
        : undefined,
      pictogramSrc: form.pictogramSrc.trim() || undefined,
    };

    const next = [...list, ev];
    setList(next);
    saveEvents(day, next);

    setForm((p) => ({ ...p, time: "", title: "", location: "", preparation: "", pictogramSrc: "" }));
    setStatus("Evento agregado.");
    setTimeout(() => setStatus(""), 1000);
  }

  function remove(id: string) {
    deleteEvent(day, id);
    setList(loadEvents(day));
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Calendario previsorio</h1>
            <p className="muted mt-1">
              Registra actividades futuras para anticiparlas (reduce ansiedad y mejora transiciones).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input className="input" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            <Chip>{day}</Chip>
          </div>
        </div>
        {status ? <div className="mt-3 text-sm">{status}</div> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <div className="font-semibold">Eventos del día</div>
          <p className="muted mt-1 text-sm">Se mostrarán automáticamente en la pantalla de Rutina.</p>

          <div className="mt-4 space-y-3">
            {!sorted.length ? (
              <div className="text-sm muted">No hay eventos.</div>
            ) : (
              sorted.map((ev) => (
                <div key={ev.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
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

                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        if (!ev.pictogramSrc) return null;

                        const imgSrc = ev.pictogramSrc.startsWith("idb:")
                          ? pictos[ev.pictogramSrc] // puede ser undefined mientras carga
                          : ev.pictogramSrc;

                        // ✅ No renderizar si aún no hay URL lista
                        if (!imgSrc) return null;

                        return (
                          <img
                            src={imgSrc}
                            alt="Pictograma"
                            className="h-16 w-16 rounded-xl border object-cover"
                          />
                        );
                      })()}


                      <button className="btn-secondary" onClick={() => remove(ev.id)}>
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
          <div className="font-semibold">Agregar evento</div>
          <div className="muted text-sm mt-1">Úsalo para anticipar salidas, terapias, medicación, etc.</div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-medium">Hora (opcional)</div>
              <input className="input mt-2" type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
            </div>

            <div>
              <div className="text-sm font-medium">Título</div>
              <input className="input mt-2" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Terapia ocupacional" />
            </div>

            <div>
              <div className="text-sm font-medium">Categoría</div>
              <select className="input mt-2" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as any }))}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value ?? "custom"}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm font-medium">Lugar (opcional)</div>
              <input className="input mt-2" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Ej: Clínica / Escuela" />
            </div>

            <div>
              <div className="text-sm font-medium">Preparación (opcional)</div>
              <textarea
                className="input mt-2"
                rows={4}
                value={form.preparation}
                onChange={(e) => setForm((p) => ({ ...p, preparation: e.target.value }))}
                placeholder="1 por línea. Ej:\n- Llevar audífonos\n- Snack\n- Agua"
              />
            </div>

            <div>
              <div className="text-sm font-medium">Pictograma (opcional)</div>
              <div className="muted text-xs">Puedes pegar URL/dataURL o subir imagen (se guarda offline).</div>
              <input
                className="input mt-2"
                value={form.pictogramSrc}
                onChange={(e) => setForm((p) => ({ ...p, pictogramSrc: e.target.value }))}
                placeholder="https://..."
              />

              <input
                className="input mt-2"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const id = await saveBlob(f);
                  setForm((p) => ({ ...p, pictogramSrc: `idb:${id}` }));
                  e.target.value = "";
                }}
              />
            </div>

            <button className="btn-primary w-full" onClick={addEvent}>
              Agregar
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
