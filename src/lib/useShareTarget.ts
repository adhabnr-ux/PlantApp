import { useEffect } from 'react';

/**
 * Handles inbound PWA "share" navigations. When the OS share sheet sends a
 * title/text/url to Cockpit, this reads them from the query string, hands the
 * combined text to the caller, and cleans the URL so a refresh won't re-fire.
 */
export function useShareTarget(onShared: (text: string) => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title') ?? '';
    const text = params.get('text') ?? '';
    const url = params.get('url') ?? '';
    if (!title && !text && !url) return;

    const combined = [title, text, url].filter(Boolean).join(' ').trim();
    if (combined) onShared(combined);

    // Strip the share params from the address bar.
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
