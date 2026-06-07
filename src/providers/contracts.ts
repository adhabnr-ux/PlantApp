import type {
  AISuggestion,
  Briefing,
  CalendarEvent,
  CaptureItem,
  EmailThread,
  NotionDatabase,
  Task,
  TaskStatus,
} from '@/types';

// ── Provider contracts ────────────────────────────────────────────────────
// Every data source the app touches sits behind one of these interfaces.
// `mock` implementations make the app fully functional with zero credentials;
// `live` implementations talk to real APIs (via /api serverless proxies).

export interface CalendarProvider {
  /** Events for the given local day (defaults to today). */
  getTodayEvents(day?: Date): Promise<CalendarEvent[]>;
}

export interface MailProvider {
  /** Threads that look like they are waiting on a reply from the user. */
  getNeedsReply(): Promise<EmailThread[]>;
}

export interface TaskProvider {
  /** Tasks due today (or overdue). */
  getTodayTasks(day?: Date): Promise<Task[]>;
  /** Flip a task's status; resolves once persisted. */
  setTaskStatus(id: string, status: TaskStatus): Promise<void>;
}

export interface CaptureResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export interface CaptureProvider {
  /** Databases the capture can be routed into. */
  listDatabases(): Promise<NotionDatabase[]>;
  /** Persist a capture to its target database. */
  createCapture(item: CaptureItem): Promise<CaptureResult>;
}

export interface AIProvider {
  /** Suggest tags / title / destination for a raw capture. */
  tagCapture(text: string, databases: NotionDatabase[]): Promise<AISuggestion>;
  /** One-paragraph natural-language summary of the day. */
  summarizeDay(briefing: Briefing): Promise<string>;
}

/** The full set of providers the app consumes. */
export interface ProviderBundle {
  calendar: CalendarProvider;
  mail: MailProvider;
  tasks: TaskProvider;
  capture: CaptureProvider;
  ai: AIProvider;
}

export type ProviderMode = 'mock' | 'live';
