/** Foto di confronto salvate in IndexedDB (non in localStorage: sono troppo grandi). */
const DB = 'dieta-spesa-photos';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const savePhoto = (id: string, dataUrl: string) => tx('readwrite', (s) => s.put(dataUrl, id));
export const getPhoto = (id: string) => tx<string | undefined>('readonly', (s) => s.get(id) as IDBRequest<string | undefined>);
export const deletePhoto = (id: string) => tx('readwrite', (s) => s.delete(id));

export async function allPhotos(): Promise<Record<string, string>> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const out: Record<string, string> = {};
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (!c) return resolve(out);
      out[String(c.key)] = c.value as string;
      c.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearPhotos(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
}

/** Ridimensiona l'immagine (lato lungo 900 px, JPEG 80%) per non occupare troppo spazio. */
export function downscale(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Immagine non valida'));
    };
    img.src = url;
  });
}
