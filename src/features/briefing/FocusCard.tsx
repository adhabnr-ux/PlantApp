import { useEffect, useState } from 'react';
import { CalendarClock, Target, Coffee } from 'lucide-react';
import type { CalendarEvent, Task } from '@/types';

const PRIORITY_RANK: Record<NonNullable<Task['priority']>, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function pickTopTask(tasks: Task[]): Task | undefined {
  return [...tasks]
    .filter((t) => t.status === 'todo')
    .sort((a, b) => {
      const pa = a.priority ? PRIORITY_RANK[a.priority] : 3;
      const pb = b.priority ? PRIORITY_RANK[b.priority] : 3;
      if (pa !== pb) return pa - pb;
      return (a.due ?? '~').localeCompare(b.due ?? '~');
    })[0];
}

function pickNextEvent(events: CalendarEvent[], now: number): CalendarEvent | undefined {
  return [...events]
    .filter((e) => !e.allDay && new Date(e.end).getTime() > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

function humanizeUntil(ms: number): string {
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

export function FocusCard({
  events,
  tasks,
}: {
  events: CalendarEvent[];
  tasks: Task[];
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const next = pickNextEvent(events, now);
  const topTask = pickTopTask(tasks);

  if (!next && !topTask) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <Coffee className="h-5 w-5 text-emerald-400" />
        <p className="text-sm text-slate-300">You're all clear right now. Breathe easy.</p>
      </div>
    );
  }

  const start = next ? new Date(next.start).getTime() : 0;
  const ongoing = next ? start <= now : false;
  const countdown = next
    ? ongoing
      ? `ends ${humanizeUntil(new Date(next.end).getTime() - now)}`
      : humanizeUntil(start - now)
    : '';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {next && (
        <div className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-slate-900/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-300 uppercase">
            <CalendarClock className="h-4 w-4" /> {ongoing ? 'Happening now' : 'Up next'}
          </div>
          <p className="truncate text-lg font-bold text-slate-50">{next.title}</p>
          <p className="mt-1 text-sm text-indigo-200">{countdown}</p>
          {next.meetingUrl && (
            <a
              href={next.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-400"
            >
              Join call
            </a>
          )}
        </div>
      )}
      {topTask && (
        <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/15 to-slate-900/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
            <Target className="h-4 w-4" /> Focus on
          </div>
          <p className="text-lg font-bold text-slate-50">{topTask.title}</p>
          {topTask.priority && (
            <p className="mt-1 text-sm text-emerald-200 capitalize">{topTask.priority} priority</p>
          )}
        </div>
      )}
    </div>
  );
}
