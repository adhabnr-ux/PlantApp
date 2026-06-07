// ── Core domain models ────────────────────────────────────────────────────
// Shared, provider-agnostic shapes. Both mock and live providers return these.

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO 8601 start time. */
  start: string;
  /** ISO 8601 end time. */
  end: string;
  allDay: boolean;
  location?: string;
  /** Video-call / meeting link, if any. */
  meetingUrl?: string;
  attendees?: string[];
  /** Hex colour used as an accent in the UI. */
  color?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  from: { name: string; email: string };
  snippet: string;
  /** ISO 8601 received time. */
  receivedAt: string;
  unread: boolean;
  /** Heuristic importance for sorting / emphasis. */
  importance: 'high' | 'normal' | 'low';
  /** Deep link to the thread in the mail client. */
  link?: string;
}

export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  /** ISO 8601 due date, if any. */
  due?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  source: 'notion' | 'local';
  databaseId?: string;
  url?: string;
}

export type CaptureStatus = 'pending' | 'sent' | 'error';

export interface CaptureItem {
  id: string;
  text: string;
  /** ISO 8601 creation time. */
  createdAt: string;
  tags: string[];
  targetDatabaseId?: string;
  targetDatabaseTitle?: string;
  status: CaptureStatus;
  /** Populated when status === 'error'. */
  error?: string;
  /** URL of the created Notion page, when available. */
  url?: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  /** Emoji or short icon string. */
  icon?: string;
}

export interface AISuggestion {
  tags: string[];
  /** A short, cleaned-up title for the capture. */
  title?: string;
  /** Id of the database the AI thinks this belongs in. */
  suggestedDatabaseId?: string;
}

/** Aggregated payload that feeds the morning briefing screen. */
export interface Briefing {
  date: string; // ISO date
  events: CalendarEvent[];
  needsReply: EmailThread[];
  tasks: Task[];
}
