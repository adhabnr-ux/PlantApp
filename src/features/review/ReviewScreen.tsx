import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, Moon, NotebookPen, Sparkles, Sunrise } from 'lucide-react';
import type { Task } from '@/types';
import { useProviders } from '@/lib/useProviders';
import { useAsync } from '@/lib/useAsync';
import { useCaptures } from '@/lib/captureStore';
import { useJournal, dayKey } from '@/lib/journal';
import { Card, SkeletonRows } from '@/components/ui';

function isToday(iso: string): boolean {
  return dayKey(new Date(iso)) === dayKey();
}

export function ReviewScreen() {
  const providers = useProviders();
  const captures = useCaptures();
  const { entry, setReflection, setPlan } = useJournal();

  const tasksState = useAsync<Task[]>(() => providers.tasks.getTodayTasks(), [providers]);
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (tasksState.data) setTasks(tasksState.data);
  }, [tasksState.data]);

  const toggle = async (task: Task) => {
    const next: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await providers.tasks.setTaskStatus(task.id, next);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;
  const remaining = tasks.filter((t) => t.status === 'todo');
  const pct = total ? Math.round((done / total) * 100) : 0;
  const capturedToday = useMemo(
    () => captures.filter((c) => isToday(c.createdAt)).length,
    [captures],
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-300">
          <Moon className="h-5 w-5" />
          <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMMM d')}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-50">Daily shutdown</h1>
        <p className="mt-1 text-sm text-slate-400">Close the loop and set up tomorrow.</p>
      </div>

      {/* Progress */}
      <Card className="p-5">
        {tasksState.loading ? (
          <SkeletonRows rows={1} />
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-50">
                  {done}
                  <span className="text-lg text-slate-500">/{total || 0}</span>
                </p>
                <p className="text-sm text-slate-400">tasks done today</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-50">{capturedToday}</p>
                <p className="text-sm text-slate-400">captured</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Roll over */}
      <section>
        <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-slate-200 uppercase">
          <Sunrise className="h-4 w-4 text-amber-400" />
          Rolls over to tomorrow
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {remaining.length}
          </span>
        </div>
        <Card className="divide-y divide-slate-800/70">
          {remaining.length === 0 ? (
            <p className="flex items-center gap-2 p-4 text-sm text-emerald-300">
              <Check className="h-4 w-4" /> Everything's done. Nice work.
            </p>
          ) : (
            remaining.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggle(task)}
                  aria-label="Mark done"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-transparent transition-colors hover:border-emerald-400 hover:text-emerald-400"
                >
                  <Check className="h-4 w-4" />
                </button>
                <span className="truncate text-sm text-slate-200">{task.title}</span>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Reflection */}
      <section>
        <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-slate-200 uppercase">
          <NotebookPen className="h-4 w-4 text-sky-400" /> Reflection
        </div>
        <textarea
          value={entry.reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How did today go? One win, one lesson…"
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </section>

      {/* Plan tomorrow */}
      <section>
        <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-slate-200 uppercase">
          <Sparkles className="h-4 w-4 text-indigo-400" /> Plan for tomorrow
        </div>
        <textarea
          value={entry.plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="The 1–3 things that would make tomorrow a win…"
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-2 px-1 text-xs text-slate-500">Saved automatically on this device.</p>
      </section>
    </div>
  );
}
