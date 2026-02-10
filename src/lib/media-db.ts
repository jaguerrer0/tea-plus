// IndexedDB helper para guardar blobs (fotos/audio) offline.

const DB_NAME = "tea_plus_media_v1";
const STORE = "blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    fn(store)
      .then((value) => {
        transaction.oncomplete = () => {
          db.close();
          resolve(value);
        };
      })
      .catch((e) => {
        db.close();
        reject(e);
      });
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export async function saveBlob(blob: Blob): Promise<string> {
  const id = uid("blob");
  await tx("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const r = store.put(blob, id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  });
  return id;
}

export async function loadBlob(id: string): Promise<Blob | null> {
  return tx("readonly", (store) => {
    return new Promise<Blob | null>((resolve, reject) => {
      const r = store.get(id);
      r.onsuccess = () => resolve((r.result as Blob) ?? null);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function deleteBlob(id: string): Promise<void> {
  await tx("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const r = store.delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  });
}

export async function blobToObjectUrl(id: string): Promise<string | null> {
  const blob = await loadBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
