import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X, Loader2, ChevronDown } from 'lucide-react';
import type { CaptureItem, NotionDatabase } from '@/types';
import { useProviders } from '@/lib/useProviders';
import { useSettings } from '@/lib/settings';
import { useAsync } from '@/lib/useAsync';
import { captureStore } from '@/lib/captureStore';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CaptureComposer({
  autoFocus = false,
  onDone,
}: {
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const providers = useProviders();
  const { settings } = useSettings();

  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsTouched, setTagsTouched] = useState(false);
  const [dbId, setDbId] = useState(settings.defaultCaptureDatabaseId);
  const [dbTouched, setDbTouched] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const dbState = useAsync<NotionDatabase[]>(
    () => providers.capture.listDatabases(),
    [providers],
  );
  const databases = dbState.data ?? [];

  useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  // Debounced AI suggestion as the user types.
  useEffect(() => {
    if (text.trim().length < 4) return;
    const handle = setTimeout(async () => {
      setSuggesting(true);
      try {
        const s = await providers.ai.tagCapture(text, databases);
        if (!tagsTouched) setTags(s.tags);
        if (!dbTouched && s.suggestedDatabaseId) setDbId(s.suggestedDatabaseId);
      } catch {
        // suggestions are best-effort
      } finally {
        setSuggesting(false);
      }
    }, 700);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, dbState.data]);

  const removeTag = (t: string) => {
    setTagsTouched(true);
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const effectiveDbId = dbId || databases[0]?.id;
  const targetDb = databases.find((d) => d.id === effectiveDbId);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const item: CaptureItem = {
      id: newId(),
      text: body,
      createdAt: new Date().toISOString(),
      tags,
      targetDatabaseId: effectiveDbId,
      targetDatabaseTitle: targetDb?.title,
      status: 'pending',
    };
    captureStore.add(item);
    // Reset the composer immediately for a snappy feel.
    setText('');
    setTags([]);
    setTagsTouched(false);
    setDbTouched(false);
    try {
      const res = await providers.capture.createCapture(item);
      captureStore.update(item.id, {
        status: res.ok ? 'sent' : 'error',
        url: res.url,
        error: res.ok ? undefined : res.error ?? 'Failed to save',
      });
    } catch (e) {
      captureStore.update(item.id, {
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to save',
      });
    } finally {
      setSending(false);
      onDone?.();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
        }}
        placeholder="What's on your mind? A task, an idea, a link…"
        rows={3}
        className="w-full resize-none bg-transparent text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />

      {/* Tags */}
      <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5">
        {suggesting && (
          <span className="inline-flex items-center gap-1 text-xs text-indigo-300/80">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> suggesting…
          </span>
        )}
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/20"
          >
            #{t}
            <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
              <X className="h-3 w-3 text-indigo-300/70 hover:text-indigo-200" />
            </button>
          </span>
        ))}
      </div>

      {/* Destination + send */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="relative">
          <select
            value={effectiveDbId ?? ''}
            onChange={(e) => {
              setDbTouched(true);
              setDbId(e.target.value);
            }}
            disabled={dbState.loading || databases.length === 0}
            className="appearance-none rounded-full border border-slate-700 bg-slate-800 py-1.5 pr-8 pl-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
          >
            {dbState.loading && <option>Loading…</option>}
            {!dbState.loading && databases.length === 0 && <option>No databases</option>}
            {databases.map((d) => (
              <option key={d.id} value={d.id}>
                {d.icon ? `${d.icon} ` : ''}
                {d.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || sending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Capture
        </button>
      </div>
    </div>
  );
}
