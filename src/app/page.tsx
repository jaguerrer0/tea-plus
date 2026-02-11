"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuickCalendar } from "@/components/quick-calendar";
import { loadAllEvents } from "@/lib/calendar-storage";
import { blobToObjectUrl } from "@/lib/media-db";

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  category?: string;
  pictogramSrc?: string; // url o idb:<id>
};

type EventView = CalendarEvent & { pictogramUrl?: string };

function getYearFromDateKey(dateKey: string) {
  const y = Number(dateKey.slice(0, 4));
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

function FeatureCard({
  title,
  desc,
  href,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  badge: string;
}) {
  return (
    <Link href={href} className="card p-5 hover:shadow-md transition">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{title}</div>
        <span className="chip">{badge}</span>
      </div>
      <p className="muted mt-2 text-sm">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
        <span className="h-2 w-2 rounded-full" style={{ background: "rgb(99 102 241)" }} />
        Abrir
      </div>
    </Link>
  );
}

export default function Home() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventViews, setSelectedEventViews] = useState<EventView[]>([]);

  useEffect(() => {
    const all = loadAllEvents() as CalendarEvent[];
    const filtered = all.filter((e) => getYearFromDateKey(e.date) === year);
    setEvents(filtered);

    setSelectedDay(null);
    setSelectedEvents([]);
    setSelectedEventViews([]);
  }, [year]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
      map.set(k, list);
    }
    return map;
  }, [events]);

  async function buildEventViews(list: CalendarEvent[]) {
    const out: EventView[] = [];

    for (const e of list) {
      const src = e.pictogramSrc;

      if (src?.startsWith("idb:")) {
        const id = src.slice(4);
        const url = await blobToObjectUrl(id); // ✅ tu función real
        if (url) out.push({ ...e, pictogramUrl: url });
        else out.push({ ...e });
        continue;
      }

      if (src) {
        out.push({ ...e, pictogramUrl: src });
        continue;
      }

      out.push({ ...e });
    }

    setSelectedEventViews(out);
  }

  const hasSelection = Boolean(selectedDay) && selectedEvents.length > 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card p-7 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full"
          style={{ background: "rgba(99,102,241,0.18)", filter: "blur(2px)" }}
        />
        <div
          className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full"
          style={{ background: "rgba(16,185,129,0.14)", filter: "blur(2px)" }}
        />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="chip">IA explicable</span>
            <span className="chip">Rutinas predecibles</span>
            <span className="chip">Feedback</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight">TEA+ crea rutinas claras y adaptables</h1>
          <p className="muted mt-2 max-w-2xl">
            Diseñada para cuidadores y personas dentro del espectro autista. La IA funciona como acelerador:
            sugiere estructura, apoyos y planes B, manteniendo control humano.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/profile" className="btn-primary">
              Crear/editar perfil
            </Link>
            <Link href="/routines" className="btn-secondary">
              Ir a rutina
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Perfil"
          desc="Edad, comunicación, contexto y sensibilidades para personalizar rutinas."
          href="/profile"
          badge="1"
        />
        <FeatureCard
          title="Generar rutina"
          desc="Rutina por bloques (mañana/tarde/noche) con pasos concretos y duración."
          href="/routines"
          badge="2"
        />
        <FeatureCard
          title="Checklist + feedback"
          desc="Marca completado, señala pasos difíciles y mejora la siguiente versión."
          href="/routines"
          badge="3"
        />
      </section>

      {/* Calendario (3 meses desktop / 1 mes móvil) */}
      <QuickCalendar
        year={year}
        events={events}
        selectedDay={selectedDay}
        onDayClick={async (dayKey) => {
          setSelectedDay(dayKey);
          const list = eventsByDate.get(dayKey) ?? [];
          setSelectedEvents(list);
          await buildEventViews(list);
        }}
      />

      {/* Controles de año */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm muted">Año mostrado</div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => setYear((y) => y - 1)}>
              −
            </button>
            <span className="chip">{year}</span>
            <button className="btn-secondary" onClick={() => setYear((y) => y + 1)}>
              +
            </button>
            <Link className="btn-secondary" href="/calendar">
              Editar calendario
            </Link>
          </div>
        </div>
      </section>

      {/* Panel del día */}
      {hasSelection ? (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold">Eventos del día</div>
              <div className="muted text-sm">{selectedDay}</div>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn-secondary" href={`/day/${selectedDay}`}>
                Ver pantalla simple
              </Link>
              <Link className="btn-primary" href="/routines">
                Ver rutina
              </Link>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedDay(null);
                  setSelectedEvents([]);
                  setSelectedEventViews([]);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {selectedEventViews.map((e) => (
              <div key={e.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{e.title}</div>
                    <div className="muted text-sm">
                      {e.time ? `Hora: ${e.time}` : "Hora: —"}
                      {e.category ? ` • ${e.category}` : ""}
                    </div>
                  </div>

                  {e.pictogramUrl ? (
                    <img
                      src={e.pictogramUrl}
                      alt="Pictograma"
                      className="h-12 w-12 rounded-xl border object-cover"
                      style={{ borderColor: "rgb(var(--border))" }}
                    />
                  ) : (
                    <span className="chip">Evento</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : selectedDay ? (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold">Sin eventos</div>
              <div className="muted text-sm">{selectedDay}</div>
            </div>
            <Link className="btn-secondary" href="/calendar">
              Agregar evento
            </Link>
          </div>
        </section>
      ) : null}

      {/* Accesos rápidos */}
      <section className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold">Accesos rápidos</div>
            <div className="muted text-sm">Familia y pictogramas personales.</div>
          </div>
          <Link className="btn-secondary" href="/people">
            Abrir Familia
          </Link>
        </div>
        <div className="muted text-sm mt-3">
          Tip: agrega tarjetas de familia con audio para apoyo comunicativo.
        </div>
      </section>
    </div>
  );
}
