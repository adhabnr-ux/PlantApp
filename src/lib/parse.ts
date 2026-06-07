// Lightweight, dependency-free parsing of a raw capture into structured hints:
// a detected link, a natural-language due date, and an inferred type.

export type CaptureType = 'task' | 'idea' | 'link' | 'note';

export interface ParsedCapture {
  type: CaptureType;
  url?: string;
  /** ISO 8601 due date, if one was detected. */
  due?: string;
  /** Human-readable echo of what was detected, e.g. "tomorrow 3:00 PM". */
  dueLabel?: string;
}

const URL_RE = /https?:\/\/[^\s]+/i;
const IDEA_RE = /\b(idea|maybe|what if|concept|brainstorm)\b/i;
const TASK_RE =
  /\b(call|email|reply|buy|finish|ship|review|send|book|pay|fix|schedule|remind|todo|task|follow.?up|submit|draft|prepare)\b/i;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function setTimeOnly(d: Date, hours: number, minutes = 0): Date {
  const copy = new Date(d);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

/** Extract a clock time like "3pm", "at 14:30", "noon" from the text. */
function extractTime(text: string): { hours: number; minutes: number } | undefined {
  if (/\bnoon\b/i.test(text)) return { hours: 12, minutes: 0 };
  if (/\bmidnight\b/i.test(text)) return { hours: 0, minutes: 0 };
  const m = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return undefined;
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (hours > 23 || minutes > 59) return undefined;
  if (ap === 'pm' && hours < 12) hours += 12;
  if (ap === 'am' && hours === 12) hours = 0;
  // Bare numbers with no am/pm and no colon are too ambiguous → ignore.
  if (!ap && !m[2]) return undefined;
  return { hours, minutes };
}

/** Detect a relative/absolute day reference and return its base Date (midnight). */
function extractDay(text: string, now: Date): Date | undefined {
  const lower = text.toLowerCase();
  if (/\btoday\b|\btonight\b/.test(lower)) return new Date(now);
  if (/\btomorrow\b|\btmrw\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  const inDays = lower.match(/\bin\s+(\d{1,3})\s+days?\b/);
  if (inDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDays[1], 10));
    return d;
  }
  if (/\bnext week\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp(`\\b${WEEKDAYS[i]}\\b`).test(lower)) {
      const d = new Date(now);
      const delta = (i - d.getDay() + 7) % 7 || 7; // next occurrence
      d.setDate(d.getDate() + delta);
      return d;
    }
  }
  return undefined;
}

function inferType(text: string, hasUrl: boolean): CaptureType {
  if (hasUrl) return 'link';
  if (IDEA_RE.test(text)) return 'idea';
  if (TASK_RE.test(text)) return 'task';
  return 'note';
}

export function parseCapture(text: string, now: Date = new Date()): ParsedCapture {
  const urlMatch = text.match(URL_RE);
  const url = urlMatch?.[0];

  const day = extractDay(text, now);
  const time = extractTime(text);

  let due: string | undefined;
  let dueLabel: string | undefined;
  if (day) {
    const base = time ? setTimeOnly(day, time.hours, time.minutes) : setTimeOnly(day, 9, 0);
    due = base.toISOString();
    const dayLabel = describeDay(base, now);
    dueLabel = time
      ? `${dayLabel} ${base.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : dayLabel;
  } else if (time) {
    const base = setTimeOnly(now, time.hours, time.minutes);
    if (base.getTime() < now.getTime()) base.setDate(base.getDate() + 1);
    due = base.toISOString();
    dueLabel = base.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  return { type: inferType(text, !!url), url, due, dueLabel };
}

function describeDay(d: Date, now: Date): string {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - start.getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff > 1 && diff < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
