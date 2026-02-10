"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PersonCard, PersonRelation } from "@/lib/types";
import { blobToObjectUrl, saveBlob, uid } from "@/lib/media-db";
import { deletePerson, loadPeople, upsertPerson } from "@/lib/people-storage";

function relLabel(r: PersonRelation) {
  const map: Record<PersonRelation, string> = {
    dad: "Papá",
    mom: "Mamá",
    brother: "Hermano",
    sister: "Hermana",
    grandpa: "Abuelo",
    grandma: "Abuela",
    uncle: "Tío",
    aunt: "Tía",
    cousin: "Primo/a",
    caregiver: "Cuidador/a",
    teacher: "Maestro/a",
    therapist: "Terapeuta",
    other: "Otro",
  };
  return map[r] ?? r;
}

type ViewPerson = PersonCard & { photoUrl?: string | null; audioUrl?: string | null };

export default function PeoplePage() {
  const [list, setList] = useState<PersonCard[]>([]);
  const [status, setStatus] = useState<string>("");

  const [form, setForm] = useState<{ name: string; relation: PersonRelation; audioText: string }>({
    name: "",
    relation: "other",
    audioText: "",
  });

  const [photoBlobId, setPhotoBlobId] = useState<string | undefined>(undefined);
  const [audioBlobId, setAudioBlobId] = useState<string | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    setList(loadPeople());
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [photoPreview, audioPreview]);

  const viewList = useMemo((): Promise<ViewPerson[]> => {
    const run = async () => {
      const base = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
      const out: ViewPerson[] = [];
      for (const p of base) {
        const photoUrl = p.photoRef ? await blobToObjectUrl(p.photoRef).catch(() => null) : null;
        const audioUrl = p.audioRef ? await blobToObjectUrl(p.audioRef).catch(() => null) : null;
        out.push({ ...p, photoUrl, audioUrl });
      }
      return out;
    };
    return run();
  }, [list]);

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    const id = await saveBlob(file);
    setPhotoBlobId(id);
    const url = URL.createObjectURL(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(url);
  }

  async function onPickAudio(file: File | null) {
    if (!file) return;
    const id = await saveBlob(file);
    setAudioBlobId(id);
    const url = URL.createObjectURL(file);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(url);
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Grabación no disponible en este navegador.");
      setTimeout(() => setStatus(""), 1400);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    recorderRef.current = rec;
    chunksRef.current = [];

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      const id = await saveBlob(blob);
      setAudioBlobId(id);
      const url = URL.createObjectURL(blob);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      setAudioPreview(url);
      setStatus("Audio grabado.");
      setTimeout(() => setStatus(""), 1000);
    };

    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") rec.stop();
    setRecording(false);
  }

  function resetForm() {
    setForm({ name: "", relation: "other", audioText: "" });
    setPhotoBlobId(undefined);
    setAudioBlobId(undefined);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setPhotoPreview(null);
    setAudioPreview(null);
  }

  function addPerson() {
    if (form.name.trim().length < 1) {
      setStatus("Escribe un nombre.");
      setTimeout(() => setStatus(""), 1200);
      return;
    }

    const p: PersonCard = {
      id: uid("person"),
      displayName: form.name.trim(),
      relation: form.relation,
      photoRef: photoBlobId,
      audioRef: audioBlobId,
      audioText: form.audioText.trim() || undefined,
      createdAtISO: new Date().toISOString(),
    };

    upsertPerson(p);
    setList(loadPeople());
    resetForm();
    setStatus("Persona agregada.");
    setTimeout(() => setStatus(""), 1000);
  }

  async function remove(id: string) {
    await deletePerson(id);
    setList(loadPeople());
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Familia / Personas</h1>
            <p className="muted mt-1">
              Tarjetas con foto y audio para reforzar reconocimiento y comunicación.
            </p>
          </div>
        </div>
        {status ? <div className="mt-3 text-sm">{status}</div> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <div className="font-semibold">Tarjetas</div>
          <p className="muted mt-1 text-sm">Toca “Reproducir” para escuchar quién es.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {/* Render async sin librerías */}
            <AsyncPeopleGrid viewList={viewList} onRemove={remove} />
          </div>
        </div>

        <aside className="card p-6">
          <div className="font-semibold">Agregar persona</div>
          <div className="muted text-sm mt-1">Foto y audio son opcionales.</div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-medium">Nombre</div>
              <input className="input mt-2" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Juan" maxLength={40} />
            </div>

            <div>
              <div className="text-sm font-medium">Relación</div>
              <select className="input mt-2" value={form.relation} onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value as PersonRelation }))}>
                {(
                  [
                    "dad",
                    "mom",
                    "brother",
                    "sister",
                    "grandpa",
                    "grandma",
                    "uncle",
                    "aunt",
                    "cousin",
                    "caregiver",
                    "teacher",
                    "therapist",
                    "other",
                  ] as PersonRelation[]
                ).map((r) => (
                  <option key={r} value={r}>
                    {relLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm font-medium">Foto (opcional)</div>
              <input className="input mt-2" type="file" accept="image/*" onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)} />
              {photoPreview ? <img src={photoPreview} alt="preview" className="mt-2 rounded-2xl border" /> : null}
            </div>

            <div>
              <div className="text-sm font-medium">Audio (opcional)</div>
              <div className="mt-2 flex gap-2">
                <button className="btn-secondary" onClick={recording ? stopRecording : startRecording}>
                  {recording ? "Detener" : "Grabar"}
                </button>
                <label className="btn-secondary" style={{ cursor: "pointer" }}>
                  Subir
                  <input className="hidden" type="file" accept="audio/*" onChange={(e) => onPickAudio(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {audioPreview ? (
                <audio className="mt-2 w-full" controls src={audioPreview} />
              ) : (
                <div className="muted text-xs mt-2">Sin audio todavía.</div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium">Texto del audio (opcional)</div>
              <input className="input mt-2" value={form.audioText} onChange={(e) => setForm((p) => ({ ...p, audioText: e.target.value }))} placeholder="Ej: Él es papá: Juan" />
            </div>

            <button className="btn-primary w-full" onClick={addPerson}>
              Agregar
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function AsyncPeopleGrid({
  viewList,
  onRemove,
}: {
  viewList: Promise<ViewPerson[]>;
  onRemove: (id: string) => void | Promise<void>;
}) {
  const [items, setItems] = useState<ViewPerson[]>([]);

  useEffect(() => {
    let alive = true;
    viewList.then((x) => {
      if (alive) setItems(x);
    });
    return () => {
      alive = false;
    };
  }, [viewList]);

  if (!items.length) {
    return <div className="text-sm muted">No hay personas agregadas.</div>;
  }

  return (
    <>
      {items.map((p) => (
        <div key={p.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{p.displayName}</div>
              <div className="muted text-sm mt-1">{relLabel(p.relation)}</div>

              <div className="mt-3">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.displayName} className="rounded-2xl border" />
                ) : (
                  <div className="chip">Sin foto</div>
                )}
              </div>

              <div className="mt-3">
                {p.audioUrl ? <audio controls className="w-full" src={p.audioUrl} /> : <div className="chip">Sin audio</div>}
              </div>

              {p.audioText ? <div className="muted text-xs mt-2">{p.audioText}</div> : null}
            </div>

            <button className="btn-secondary" onClick={() => onRemove(p.id)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
