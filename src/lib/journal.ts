import { useCallback, useEffect, useState } from 'react';

export interface JournalEntry {
  reflection: string;
  plan: string;
}

const STORAGE_KEY = 'cockpit.journal.v1';
const EMPTY: JournalEntry = { reflection: '', plan: '' };

type JournalMap = Record<string, JournalEntry>;

function readAll(): JournalMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as JournalMap) : {};
  } catch {
    return {};
  }
}

/** Local date key like "2026-06-07" for the given date. */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A reflection + tomorrow-plan note for a single day, persisted locally. */
export function useJournal(key: string = dayKey()) {
  const [entry, setEntry] = useState<JournalEntry>(() => readAll()[key] ?? EMPTY);

  // Reload when the day key changes.
  useEffect(() => {
    setEntry(readAll()[key] ?? EMPTY);
  }, [key]);

  const persist = useCallback(
    (next: JournalEntry) => {
      setEntry(next);
      const all = readAll();
      all[key] = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        // ignore quota / unavailable storage
      }
    },
    [key],
  );

  const setReflection = useCallback(
    (reflection: string) => persist({ ...entry, reflection }),
    [entry, persist],
  );
  const setPlan = useCallback((plan: string) => persist({ ...entry, plan }), [entry, persist]);

  return { entry, setReflection, setPlan };
}
