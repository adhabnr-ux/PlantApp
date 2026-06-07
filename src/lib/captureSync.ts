import { useEffect, useState } from 'react';
import type { CaptureItem } from '@/types';
import type { CaptureProvider } from '@/providers/contracts';
import { captureStore } from './captureStore';
import { useProviders } from './useProviders';

// Centralized capture send + offline queue. All capture writes go through
// here so the composer, manual retries, and the background flush share one
// code path. Items that fail while offline become 'queued' and are retried
// automatically when connectivity returns.

let active: CaptureProvider | null = null;

export function setActiveCapture(provider: CaptureProvider) {
  active = provider;
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Attempt to persist a capture, updating its status in the store. */
export async function sendCapture(item: CaptureItem): Promise<void> {
  if (!active || isOffline()) {
    captureStore.update(item.id, { status: 'queued', error: undefined });
    return;
  }
  captureStore.update(item.id, { status: 'pending', error: undefined });
  try {
    const res = await active.createCapture(item);
    if (res.ok) {
      captureStore.update(item.id, { status: 'sent', url: res.url, error: undefined });
    } else {
      captureStore.update(item.id, { status: 'error', error: res.error ?? 'Failed to save' });
    }
  } catch (e) {
    captureStore.update(
      item.id,
      isOffline()
        ? { status: 'queued', error: undefined }
        : { status: 'error', error: e instanceof Error ? e.message : 'Failed to save' },
    );
  }
}

/** Retry every queued capture (e.g. on reconnect). */
export async function flushQueued(): Promise<void> {
  if (!active || isOffline()) return;
  for (const item of captureStore.getSnapshot()) {
    if (item.status === 'queued') await sendCapture(item);
  }
}

/** Tracks browser online/offline state. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/**
 * Wires the active capture provider and the background sync loop. Mount once
 * near the app root. Returns the current online state for UI affordances.
 */
export function useCaptureSync(): { online: boolean } {
  const providers = useProviders();
  const online = useOnline();

  useEffect(() => {
    setActiveCapture(providers.capture);
    void flushQueued();
  }, [providers]);

  useEffect(() => {
    const onOnline = () => void flushQueued();
    window.addEventListener('online', onOnline);
    const id = window.setInterval(() => {
      if (!isOffline()) void flushQueued();
    }, 30_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(id);
    };
  }, []);

  return { online };
}
