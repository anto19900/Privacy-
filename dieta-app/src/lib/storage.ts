const PREFIX = 'dieta-spesa:v1:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // spazio esaurito o storage non disponibile: l'app continua in memoria
  }
}

export function clearAll(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignora */
  }
}

/** Tutti i dati dell'app (per il backup). */
export function exportBackup(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => {
        try {
          out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) ?? 'null');
        } catch {
          /* chiave corrotta: saltata */
        }
      });
  } catch {
    /* storage non disponibile */
  }
  return out;
}

export const BACKUP_KEYS = ['profile', 'plan', 'weights', 'shopping', 'foodLog', 'reminders', 'measurements', 'pantry'];

export function importBackup(data: Record<string, unknown>): void {
  clearAll();
  for (const k of BACKUP_KEYS) if (k in data) save(k, data[k]);
}
