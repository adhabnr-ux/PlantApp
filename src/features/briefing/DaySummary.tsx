import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Briefing } from '@/types';
import type { AIProvider } from '@/providers/contracts';

export function DaySummary({
  ai,
  briefing,
  disabled,
}: {
  ai: AIProvider;
  briefing: Briefing;
  disabled: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await ai.summarizeDay(briefing));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not summarize your day.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-sky-600/10">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-indigo-200">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold">AI day summary</span>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={disabled || loading}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {summary ? 'Regenerate' : 'Summarize'}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {(summary || error) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            {error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : (
              <p className="text-sm leading-relaxed text-slate-200">{summary}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
