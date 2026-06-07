import { format } from 'date-fns';
import { Clock, MapPin, Video } from 'lucide-react';
import { motion } from 'motion/react';
import type { CalendarEvent } from '@/types';
import { Card, EmptyState } from '@/components/ui';

function timeLabel(ev: CalendarEvent): string {
  if (ev.allDay) return 'All day';
  return format(new Date(ev.start), 'h:mm a');
}

export function ScheduleList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Clock className="h-7 w-7" />}
          title="Nothing scheduled"
          hint="Your calendar is clear today. Enjoy the open space."
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-800/70">
      {events.map((ev, i) => (
        <motion.div
          key={ev.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex gap-3 p-4"
        >
          <div className="flex w-16 shrink-0 flex-col items-end pt-0.5">
            <span className="text-sm font-semibold text-slate-100">
              {timeLabel(ev)}
            </span>
            {!ev.allDay && (
              <span className="text-xs text-slate-500">
                {format(new Date(ev.end), 'h:mm a')}
              </span>
            )}
          </div>
          <div
            className="mt-1 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: ev.color ?? '#6366f1' }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-100">{ev.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              {ev.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {ev.location}
                </span>
              )}
              {ev.meetingUrl && (
                <a
                  href={ev.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                >
                  <Video className="h-3.5 w-3.5" /> Join
                </a>
              )}
              {ev.attendees && ev.attendees.length > 1 && (
                <span>{ev.attendees.length} people</span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </Card>
  );
}
