import { useSyncExternalStore } from 'react';
import type { CaptureItem } from '@/types';

const STORAGE_KEY = 'cockpit.captures.v1';
const MAX_ITEMS = 50;

// A tiny shared external store so every component sees the same capture list
// and updates live (via useSyncExternalStore).

function read(): CaptureItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CaptureItem[]) : [];
  } catch {
    return [];
  }
}

let items: CaptureItem[] = read();
const listeners = new Set<() => void>();

function emit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore quota / unavailable storage
  }
  listeners.forEach((l) => l());
}

export const captureStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return items;
  },
  add(item: CaptureItem) {
    items = [item, ...items].slice(0, MAX_ITEMS);
    emit();
  },
  update(id: string, patch: Partial<CaptureItem>) {
    items = items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    emit();
  },
  remove(id: string) {
    items = items.filter((it) => it.id !== id);
    emit();
  },
};

export function useCaptures(): CaptureItem[] {
  return useSyncExternalStore(captureStore.subscribe, captureStore.getSnapshot, () => items);
}
