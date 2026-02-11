"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  category?: string;
  pictogramSrc?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function monthLabelEs(monthIndex0: number) {
  const names = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  return names[monthIndex0] ?? "Mes";
}

function startOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0, 1);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

// Lunes=0 ... Domingo=6
function weekdayMon0(date: Date) {
  const js = date.getDay(); // 0=Dom ... 6=Sab
  return (js + 6) % 7;
}

function buildMonthGrid(year: number, monthIndex0: number) {
  const first = startOfMonth(year, monthIndex0);
  const offset = weekdayMon0(first);
  const totalDays = daysInMonth(year, monthIndex0);

  const cells: Array<{ date?: Date; key: string }> = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - offset + 1;
    if (dayNum >= 1 && dayNum <= totalDays) {
      const d = new Date(year, monthIndex0, dayNum);
      cells.push({ date: d, key: toDateKey(d) });
    } else {
      cells.push({ key: `empty-${year}-${monthIndex0}-${i}` });
    }
  }
  return cells;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return isMobile;
}

export function QuickCalendar({
  year,
  events,
  selectedDay,
  onDayClick,
}: {
  year: number;
  events: CalendarEvent[];
  selectedDay?: string | null;
  onDayClick?: (dayKey: string) => void;
}) {
  const isMobile = useIsMobile();

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    return m;
  }, [events]);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const currentMonth = useMemo(() => new Date().getMonth(), []);

  // Mobile: page = mes (0..11). Desktop: page = trimestre (0..3)
  const [page, setPage] = useState(() => (isMobile ? currentMonth : Math.floor(currentMonth / 3)));

  useEffect(() => {
    setPage(isMobile ? currentMonth : Math.floor(currentMonth / 3));
  }, [isMobile, currentMonth]);

  const monthsToShow = useMemo(() => {
    if (isMobile) return [page];
    const start = page * 3;
    return [start, start + 1, start + 2];
  }, [isMobile, page]);

  const maxPage = isMobile ? 11 : 3;

  function hasEvents(dayKey: string) {
    return (eventsByDate.get(dayKey)?.length ?? 0) > 0;
  }

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">Calendario rápido</div>
          <div className="muted text-sm">
            Toca un día para ver el detalle. Los días con evento tienen un punto verde.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            ←
          </button>

          <span className="chip">{year}</span>

          <button className="btn-secondary" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
            →
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {monthsToShow.map((monthIndex0) => {
          const grid = buildMonthGrid(year, monthIndex0);

          return (
            <div key={`${year}-${monthIndex0}`} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{monthLabelEs(monthIndex0)}</div>
                <span className="chip text-xs">L M M J V S D</span>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
                {/* FIX: keys únicas aunque haya dos "M" */}
                {["L","M","M","J","V","S","D"].map((d, idx) => (
                  <div key={`${d}-${idx}`} className="text-xs muted text-center">
                    {d}
                  </div>
                ))}

                {grid.map((cell) => {
                  if (!cell.date) return <div key={cell.key} />;

                  const dayKey = cell.key;
                  const dayNum = cell.date.getDate();
                  const isToday = dayKey === todayKey;
                  const isSelected = selectedDay === dayKey;
                  const dot = hasEvents(dayKey);

                  return (
                    <button
                      key={dayKey}
                      onClick={() => onDayClick?.(dayKey)}
                      className="rounded-lg border px-2 py-1 text-center transition hover:bg-black/[0.03]"
                      style={
                        isSelected
                          ? { borderColor: "rgb(var(--brand) / 0.45)", boxShadow: "0 0 0 3px rgb(var(--brand) / 0.10)" }
                          : isToday
                            ? { borderColor: "rgb(16 185 129 / 0.35)", background: "rgb(16 185 129 / 0.06)" }
                            : undefined
                      }
                      title={dot ? "Ver eventos" : "Sin eventos"}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{dayNum}</span>
                        {dot ? <span className="h-2 w-2 rounded-full" style={{ background: "rgb(16 185 129)" }} /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-xs muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "rgb(16 185 129)" }} />
                  Evento
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
