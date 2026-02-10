import type { PersonCard } from "@/lib/types";
import { deleteBlob } from "@/lib/media-db";

const PEOPLE_KEY = "tea_plus_people_v1";

export function loadPeople(): PersonCard[] {
  const raw = localStorage.getItem(PEOPLE_KEY);
  return raw ? (JSON.parse(raw) as PersonCard[]) : [];
}

export function savePeople(list: PersonCard[]) {
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(list));
}

export function upsertPerson(p: PersonCard) {
  const list = loadPeople();
  const next = list.filter((x) => x.id !== p.id);
  next.push(p);
  savePeople(next);
}

export async function deletePerson(id: string) {
  const list = loadPeople();
  const target = list.find((x) => x.id === id);
  const next = list.filter((x) => x.id !== id);
  savePeople(next);
  // Limpia blobs asociados si existían (no falla si no existen)
  if (target?.photoRef) await deleteBlob(target.photoRef).catch(() => undefined);
  if (target?.audioRef) await deleteBlob(target.audioRef).catch(() => undefined);
}
