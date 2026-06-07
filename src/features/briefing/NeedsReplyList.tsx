import { formatDistanceToNow } from 'date-fns';
import { Inbox, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { EmailThread } from '@/types';
import { Card, EmptyState } from '@/components/ui';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const importanceRing: Record<EmailThread['importance'], string> = {
  high: 'ring-rose-500/40 bg-rose-500/15 text-rose-300',
  normal: 'ring-slate-600 bg-slate-700/40 text-slate-300',
  low: 'ring-slate-700 bg-slate-800 text-slate-400',
};

export function NeedsReplyList({ emails }: { emails: EmailThread[] }) {
  if (emails.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title="Inbox zero on replies"
          hint="No threads are waiting on you right now."
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-800/70">
      {emails.map((mail, i) => (
        <motion.a
          key={mail.id}
          href={mail.link ?? '#'}
          target={mail.link ? '_blank' : undefined}
          rel="noreferrer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="group flex gap-3 p-4 transition-colors hover:bg-slate-800/40"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${importanceRing[mail.importance]}`}
          >
            {initials(mail.from.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-100">
                {mail.from.name}
              </p>
              <span className="shrink-0 text-xs text-slate-500">
                {formatDistanceToNow(new Date(mail.receivedAt), { addSuffix: true })}
              </span>
            </div>
            <p className="truncate text-sm text-slate-300">{mail.subject}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{mail.snippet}</p>
          </div>
          {mail.link && (
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-600 group-hover:text-sky-400" />
          )}
        </motion.a>
      ))}
    </Card>
  );
}
