"use client";

import { useMemo } from "react";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstDow(year: number, monthIndex: number) {
  // 0..6 (Dom..Sab)
  return new Date(year, monthIndex, 1).getDay();
}

const DOW = ["D", "L", "M", "M", "J", "V", "S"];

export default function YearCalendar({
  year,
  daysWithEvents,
  onSelectDay,
}: {
  year: number;
  daysWithEvents: Set<string>;
  onSelectDay: (dayKey: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const dim = daysInMonth(year, m);
      const start = firstDow(year, m);

      const cells: Array<{ label: string; dayKey?: string }> = [];
      for (let i = 0; i < start; i++) cells.push({ label: "" });
      for (let d = 1; d <= dim; d++) {
        const dayKey = `${year}-${pad(m + 1)}-${pad(d)}`;
        cells.push({ label: String(d), dayKey });
      }
      // Rellena a múltiplos de 7 para alinear
      while (cells.length % 7 !== 0) cells.push({ label: "" });

      return { monthIndex: m, name: MONTH_NAMES[m], cells };
    });
  }, [year]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {months.map((m) => (
        <div key={m.monthIndex} className="card p-4">
          <div className="font-medium">{m.name}</div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-xs muted">
            {DOW.map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {m.cells.map((c, i) => {
              if (!c.dayKey) return <div key={i} className="h-7" />;
              const has = daysWithEvents.has(c.dayKey);
              const isToday = c.dayKey === today;

              return (
                <button
                  key={i}
                  className="h-7 rounded-lg border text-xs font-medium transition"
                  style={
                    has
                      ? { background: "rgba(16,185,129,0.10)", borderColor: "rgba(16,185,129,0.35)" }
                      : isToday
                        ? { background: "rgba(99,102,241,0.10)", borderColor: "rgba(99,102,241,0.35)" }
                        : { background: "rgba(0,0,0,0.02)", borderColor: "rgb(var(--border))" }
                  }
                  onClick={() => onSelectDay(c.dayKey!)}
                  title={has ? "Tiene eventos" : ""}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-xs muted">
            <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: "rgba(16,185,129,0.65)" }} />
            Evento
          </div>
        </div>
      ))}
    </div>
  );
}
