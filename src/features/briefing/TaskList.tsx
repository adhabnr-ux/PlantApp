import { format } from 'date-fns';
import { Check, ListTodo, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { Task } from '@/types';
import { Card, EmptyState } from '@/components/ui';

const priorityDot: Record<NonNullable<Task['priority']>, string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-500',
};

export function TaskList({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ListTodo className="h-7 w-7" />}
          title="No tasks for today"
          hint="Capture one with the + button whenever something comes up."
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-800/70">
      {tasks.map((task, i) => {
        const done = task.status === 'done';
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-4"
          >
            <button
              type="button"
              onClick={() => onToggle(task)}
              aria-label={done ? 'Mark as not done' : 'Mark as done'}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-600 text-transparent hover:border-emerald-400'
              }`}
            >
              <Check className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${
                  done ? 'text-slate-500 line-through' : 'text-slate-100'
                }`}
              >
                {task.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {task.priority && (
                  <span className="inline-flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[task.priority]}`} />
                    {task.priority}
                  </span>
                )}
                {task.due && <span>Due {format(new Date(task.due), 'h:mm a')}</span>}
                {task.tags?.map((t) => (
                  <span key={t} className="text-indigo-300/80">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
            {task.url && (
              <a
                href={task.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open task"
                className="shrink-0 text-slate-600 hover:text-sky-400"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </motion.div>
        );
      })}
    </Card>
  );
}
