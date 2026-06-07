import {
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  CloudOff,
  RotateCw,
  SearchX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import type { CaptureItem } from '@/types';
import { captureStore, useCaptures } from '@/lib/captureStore';
import { sendCapture } from '@/lib/captureSync';
import { Card, EmptyState } from '@/components/ui';

function StatusBadge({ item }: { item: CaptureItem }) {
  switch (item.status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> saving
        </span>
      );
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <CloudOff className="h-3.5 w-3.5" /> queued
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-300" title={item.error}>
          <AlertCircle className="h-3.5 w-3.5" /> failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
          <Check className="h-3.5 w-3.5" /> saved
        </span>
      );
  }
}

export function RecentCaptures({ query = '' }: { query?: string }) {
  const all = useCaptures();
  const q = query.trim().toLowerCase();
  const items = q
    ? all.filter(
        (it) =>
          it.text.toLowerCase().includes(q) ||
          it.tags.some((t) => t.toLowerCase().includes(q)) ||
          it.targetDatabaseTitle?.toLowerCase().includes(q),
      )
    : all;

  if (all.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title="No captures yet"
          hint="Anything you capture lands here and is routed into Notion."
        />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<SearchX className="h-7 w-7" />}
          title="No matches"
          hint={`Nothing captured matches “${query}”.`}
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-800/70">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const retryable = item.status === 'error' || item.status === 'queued';
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="group p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm text-slate-100">{item.text}</p>
                <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {retryable && (
                    <button
                      type="button"
                      onClick={() => void sendCapture(item)}
                      aria-label="Retry"
                      className="text-slate-600 hover:text-sky-400"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => captureStore.remove(item.id)}
                    aria-label="Delete capture"
                    className="text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <StatusBadge item={item} />
                {item.targetDatabaseTitle && <span>→ {item.targetDatabaseTitle}</span>}
                <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                {item.tags.map((t) => (
                  <span key={t} className="text-indigo-300/80">
                    #{t}
                  </span>
                ))}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                  >
                    open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Card>
  );
}
