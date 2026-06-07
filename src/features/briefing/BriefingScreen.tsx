import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Inbox, ListTodo, Plus, RefreshCw } from 'lucide-react';
import type { Briefing, Task } from '@/types';
import { useProviders } from '@/lib/useProviders';
import { useSettings } from '@/lib/settings';
import { useAsync } from '@/lib/useAsync';
import {
  Card,
  ErrorNote,
  SectionHeader,
  SkeletonRows,
  Spinner,
} from '@/components/ui';
import { ScheduleList } from './ScheduleList';
import { NeedsReplyList } from './NeedsReplyList';
import { TaskList } from './TaskList';
import { DaySummary } from './DaySummary';
import { FocusCard } from './FocusCard';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function BriefingScreen({ onCapture }: { onCapture: () => void }) {
  const providers = useProviders();
  const { settings } = useSettings();
  const { sources } = settings;

  const eventsState = useAsync(
    () => (sources.calendar ? providers.calendar.getTodayEvents() : Promise.resolve([])),
    [providers, sources.calendar],
  );
  const mailState = useAsync(
    () => (sources.mail ? providers.mail.getNeedsReply() : Promise.resolve([])),
    [providers, sources.mail],
  );
  const tasksState = useAsync(
    () => (sources.tasks ? providers.tasks.getTodayTasks() : Promise.resolve([])),
    [providers, sources.tasks],
  );

  // Local task copy for optimistic toggling.
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (tasksState.data) setTasks(tasksState.data);
  }, [tasksState.data]);

  const toggleTask = async (task: Task) => {
    const next: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      await providers.tasks.setTaskStatus(task.id, next);
    } catch {
      // revert on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const reloadAll = () => {
    eventsState.reload();
    mailState.reload();
    tasksState.reload();
  };

  const anyLoading = eventsState.loading || mailState.loading || tasksState.loading;
  const briefing: Briefing = {
    date: new Date().toISOString(),
    events: eventsState.data ?? [],
    needsReply: mailState.data ?? [],
    tasks,
  };

  return (
    <div className="space-y-6">
      {/* Greeting + refresh */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl font-bold text-slate-50">
            {greeting()}
            {settings.userName ? `, ${settings.userName}` : ''}.
          </h1>
        </div>
        <button
          type="button"
          onClick={reloadAll}
          aria-label="Refresh"
          className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-colors hover:text-slate-200"
        >
          {anyLoading ? <Spinner className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
        </button>
      </div>

      {/* Quick capture entry — the always-present capture bar. */}
      <button
        type="button"
        onClick={onCapture}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-left text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-slate-200"
      >
        <Plus className="h-5 w-5 text-indigo-400" />
        <span className="text-sm">Capture a thought, task or link…</span>
      </button>

      {!anyLoading && (
        <FocusCard events={eventsState.data ?? []} tasks={tasks} />
      )}

      <DaySummary ai={providers.ai} briefing={briefing} disabled={anyLoading} />

      {/* Schedule */}
      {sources.calendar && (
        <section>
          <SectionHeader
            icon={<CalendarDays className="h-4 w-4" />}
            title="Today"
            accent="text-indigo-400"
            count={eventsState.data?.length}
          />
          {eventsState.loading ? (
            <Card><SkeletonRows rows={3} /></Card>
          ) : eventsState.error ? (
            <ErrorNote message={eventsState.error} />
          ) : (
            <ScheduleList events={eventsState.data ?? []} />
          )}
        </section>
      )}

      {/* Needs reply */}
      {sources.mail && (
        <section>
          <SectionHeader
            icon={<Inbox className="h-4 w-4" />}
            title="Needs reply"
            accent="text-sky-400"
            count={mailState.data?.length}
          />
          {mailState.loading ? (
            <Card><SkeletonRows rows={2} /></Card>
          ) : mailState.error ? (
            <ErrorNote message={mailState.error} />
          ) : (
            <NeedsReplyList emails={mailState.data ?? []} />
          )}
        </section>
      )}

      {/* Tasks */}
      {sources.tasks && (
        <section>
          <SectionHeader
            icon={<ListTodo className="h-4 w-4" />}
            title="Tasks"
            accent="text-emerald-400"
            count={tasks.filter((t) => t.status === 'todo').length}
          />
          {tasksState.loading ? (
            <Card><SkeletonRows rows={3} /></Card>
          ) : tasksState.error ? (
            <ErrorNote message={tasksState.error} />
          ) : (
            <TaskList tasks={tasks} onToggle={toggleTask} />
          )}
        </section>
      )}
    </div>
  );
}
