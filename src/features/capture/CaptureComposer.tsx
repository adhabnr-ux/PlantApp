import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  Sparkles,
  X,
  Loader2,
  ChevronDown,
  Mic,
  Link as LinkIcon,
  Clock,
  CheckSquare,
  Lightbulb,
  StickyNote,
} from 'lucide-react';
import type { CaptureItem, NotionDatabase } from '@/types';
import { useProviders } from '@/lib/useProviders';
import { useSettings } from '@/lib/settings';
import { useAsync } from '@/lib/useAsync';
import { useSpeech } from '@/lib/useSpeech';
import { captureStore } from '@/lib/captureStore';
import { sendCapture } from '@/lib/captureSync';
import { parseCapture, type CaptureType } from '@/lib/parse';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `cap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TYPE_META: Record<CaptureType, { icon: typeof CheckSquare; label: string }> = {
  task: { icon: CheckSquare, label: 'Task' },
  idea: { icon: Lightbulb, label: 'Idea' },
  link: { icon: LinkIcon, label: 'Link' },
  note: { icon: StickyNote, label: 'Note' },
};

export function CaptureComposer({
  autoFocus = false,
  initialText = '',
  onDone,
}: {
  autoFocus?: boolean;
  initialText?: string;
  onDone?: () => void;
}) {
  const providers = useProviders();
  const { settings } = useSettings();

  const [text, setText] = useState(initialText);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsTouched, setTagsTouched] = useState(false);
  const [dbId, setDbId] = useState(settings.defaultCaptureDatabaseId);
  const [dbTouched, setDbTouched] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const speech = useSpeech((chunk) =>
    setText((prev) => (prev ? `${prev} ${chunk}` : chunk)),
  );

  const dbState = useAsync<NotionDatabase[]>(
    () => providers.capture.listDatabases(),
    [providers],
  );
  const databases = dbState.data ?? [];

  const parsed = useMemo(() => parseCapture(text), [text]);

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
  const TypeIcon = TYPE_META[parsed.type].icon;

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    if (speech.listening) speech.stop();
    // Fold the inferred type into the tags so captures stay searchable.
    const finalTags = tags.includes(parsed.type) ? tags : [parsed.type, ...tags];
    const item: CaptureItem = {
      id: newId(),
      text: body,
      createdAt: new Date().toISOString(),
      tags: finalTags,
      targetDatabaseId: effectiveDbId,
      targetDatabaseTitle: targetDb?.title,
      status: 'pending',
    };
    captureStore.add(item);
    // Reset immediately for a snappy feel.
    setText('');
    setTags([]);
    setTagsTouched(false);
    setDbTouched(false);
    try {
      await sendCapture(item);
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

      {speech.listening && (
        <p className="mb-1 text-xs text-rose-300">
          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-rose-400 align-middle" />
          Listening… {speech.interim}
        </p>
      )}

      {/* Inferred hints */}
      {text.trim().length > 0 && (
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 font-medium text-slate-300">
            <TypeIcon className="h-3.5 w-3.5" /> {TYPE_META[parsed.type].label}
          </span>
          {parsed.dueLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-300 ring-1 ring-amber-500/20">
              <Clock className="h-3.5 w-3.5" /> {parsed.dueLabel}
            </span>
          )}
          {parsed.url && (
            <span className="inline-flex max-w-[12rem] items-center gap-1 truncate rounded-full bg-sky-500/15 px-2 py-0.5 font-medium text-sky-300 ring-1 ring-sky-500/20">
              <LinkIcon className="h-3.5 w-3.5" /> link
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1.5">
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

      {/* Destination + actions */}
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

        <div className="flex items-center gap-2">
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-label={speech.listening ? 'Stop dictation' : 'Dictate'}
              className={`rounded-full p-2 transition-colors ${
                speech.listening
                  ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                  : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
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
    </div>
  );
}
