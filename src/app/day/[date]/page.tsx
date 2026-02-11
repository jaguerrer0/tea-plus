"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import type { PlannedEvent, PersonCard } from "@/lib/types";
import { loadEvents } from "@/lib/calendar-storage";
import { blobToObjectUrl } from "@/lib/media-db";
import { loadPeople } from "@/lib/people-storage";

function personDisplayName(p: PersonCard): string {
  // Soporta varias variantes posibles sin romper TS
  const anyP = p as any;
  return (
    anyP.name ??
    anyP.label ??
    anyP.title ??
    anyP.displayName ??
    anyP.relation ??
    "Familiar"
  );
}


type EventView = PlannedEvent & { pictogramUrl?: string };

type ModalPayload =
  | { kind: "image"; title: string; imageUrl: string }
  | { kind: "person"; title: string; imageUrl?: string; audioUrl?: string; autocloseMs?: number };

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

function isIdb(src?: string) {
  return !!src && src.startsWith("idb:");
}

async function resolveEventPicUrl(pictogramSrc?: string): Promise<string | undefined> {
  if (!pictogramSrc) return undefined;

  // Evento: soporta url normal o "idb:<blobId>"
  if (isIdb(pictogramSrc)) {
    const id = pictogramSrc.slice(4);
    const url = await blobToObjectUrl(id);
    return url ?? undefined;
  }

  return pictogramSrc;
}

export default function DayPage() {
  const params = useParams<{ date: string }>();
  const dateKey = params?.date; // YYYY-MM-DD

  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [eventViews, setEventViews] = useState<EventView[]>([]);

  const [people, setPeople] = useState<PersonCard[]>([]);
  const [peopleThumbs, setPeopleThumbs] = useState<Record<string, string>>({}); // photoRef -> objectURL

  const [modal, setModal] = useState<ModalPayload | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Load events for that day ---
  useEffect(() => {
    if (!dateKey) return;
    setEvents(loadEvents(dateKey));
  }, [dateKey]);

  // --- Load family cards ---
  useEffect(() => {
    setPeople(loadPeople());
  }, []);

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [events]);

  // --- Resolve pictograms for events (idb -> objectURL) ---
  useEffect(() => {
    let cancelled = false;
    const urlsToRevoke: string[] = [];

    (async () => {
      const out: EventView[] = [];
      for (const ev of sorted) {
        const url = await resolveEventPicUrl(ev.pictogramSrc);
        if (url && isIdb(ev.pictogramSrc)) urlsToRevoke.push(url);
        out.push({ ...ev, pictogramUrl: url });
      }
      if (!cancelled) setEventViews(out);
      else urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    })();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [sorted]);

  // --- Resolve thumbnails for people (photoRef -> objectURL) ---
  useEffect(() => {
    let cancelled = false;
    const urlsToRevoke: string[] = [];

    (async () => {
      const map: Record<string, string> = {};
      for (const p of people) {
        if (p.photoRef) {
          const url = await blobToObjectUrl(p.photoRef);
          if (url) {
            map[p.photoRef] = url;
            urlsToRevoke.push(url);
          }
        }
      }
      if (!cancelled) setPeopleThumbs(map);
      else urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    })();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [people]);

  // --- ESC closes modal ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function stopModalAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function closeModal() {
    clearCloseTimer();
    stopModalAudio();
    setModal(null);
  }

  async function openPictogram(ev: EventView) {
    if (!ev.pictogramUrl) return;
    setModal({ kind: "image", title: ev.title, imageUrl: ev.pictogramUrl });
  }

  async function openPerson(p: PersonCard) {
    // Person: photoRef/audioRef son IDs (no "idb:")
    const [imageUrl, audioUrl] = await Promise.all([
      p.photoRef ? blobToObjectUrl(p.photoRef) : Promise.resolve(null),
      p.audioRef ? blobToObjectUrl(p.audioRef) : Promise.resolve(null),
    ]);

    setModal({
      kind: "person",
      title: personDisplayName(p),
      imageUrl: imageUrl ?? undefined,
      audioUrl: audioUrl ?? undefined,
      autocloseMs: 5000,
    });

    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      stopModalAudio();
      setModal(null);
      closeTimerRef.current = null;
    }, 5000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Hoy</h1>
            <div className="muted text-sm mt-1">Pantalla simple para anticipar actividades.</div>
          </div>

          <div className="flex items-center gap-2">
            <Link className="btn-secondary" href="/calendar">
              Editar calendario
            </Link>
            <Link className="btn-secondary" href="/">
              Inicio
            </Link>
            <Chip>{dateKey}</Chip>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {/* Agenda */}
        <div className="card p-6 md:col-span-2">
          <div className="font-semibold">Agenda del día</div>
          <div className="muted text-sm mt-1">Toca el pictograma para ampliarlo.</div>

          <div className="mt-4 space-y-3">
            {!eventViews.length ? (
              <div className="text-sm muted">No hay eventos programados.</div>
            ) : (
              eventViews.map((ev) => (
                <div key={ev.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">
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

                    {ev.pictogramUrl ? (
                      <button
                        className="shrink-0"
                        onClick={() => openPictogram(ev)}
                        onDoubleClick={() => openPictogram(ev)}
                        aria-label="Abrir pictograma"
                        title="Abrir pictograma"
                      >
                        <img
                          src={ev.pictogramUrl}
                          alt="Pictograma"
                          className="h-24 w-24 rounded-xl border object-cover"
                          style={{ borderColor: "rgb(var(--border))" }}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Familia */}
        <aside className="card p-6">
          <div className="font-semibold">Familia (tarjetas)</div>
          <div className="muted text-sm mt-1">Toca una tarjeta para ver imagen + oír audio.</div>

          <div className="mt-4 space-y-2">
            {!people.length ? (
              <div className="text-sm muted">No hay tarjetas aún.</div>
            ) : (
              people.map((p) => {
                const thumb = p.photoRef ? peopleThumbs[p.photoRef] : undefined;

                return (
                  <button
                    key={p.id}
                    className="card p-3 w-full text-left flex items-center gap-3"
                    onClick={() => openPerson(p)}
                  >
                    <div
                      className="h-12 w-12 rounded-xl border overflow-hidden bg-black/[0.02] flex items-center justify-center shrink-0"
                      style={{ borderColor: "rgb(var(--border))" }}
                    >
                      {thumb ? (
                        <img src={thumb} alt={personDisplayName(p)} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs muted">img</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">{personDisplayName(p)}</div>
                      <div className="text-xs muted">Tocar</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </section>

      {/* MODAL fullscreen */}
      {modal ? (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="card p-4 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{modal.title}</div>
              <button className="btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>

            <div className="mt-4">
              {modal.kind === "image" ? (
                <img
                  src={modal.imageUrl}
                  alt={modal.title}
                  className="w-full max-h-[75vh] object-contain rounded-2xl border"
                  style={{ borderColor: "rgb(var(--border))" }}
                />
              ) : (
                <div className="space-y-3">
                  {modal.imageUrl ? (
                    <img
                      src={modal.imageUrl}
                      alt={modal.title}
                      className="w-full max-h-[65vh] object-contain rounded-2xl border"
                      style={{ borderColor: "rgb(var(--border))" }}
                    />
                  ) : (
                    <div className="card p-8 text-center muted">Sin imagen</div>
                  )}

                  {modal.audioUrl ? (
                    <audio ref={audioRef} src={modal.audioUrl} autoPlay />
                  ) : (
                    <div className="text-sm muted">Sin audio</div>
                  )}

                  <div className="text-xs muted">
                    Se cerrará automáticamente en {Math.round((modal.autocloseMs ?? 0) / 1000)} segundos.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
