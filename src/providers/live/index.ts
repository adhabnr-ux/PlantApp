import type {
  AIProvider,
  CalendarProvider,
  CaptureProvider,
  CaptureResult,
  MailProvider,
  ProviderBundle,
  TaskProvider,
} from '@/providers/contracts';
import type {
  AISuggestion,
  Briefing,
  CalendarEvent,
  EmailThread,
  NotionDatabase,
  Task,
} from '@/types';

import { GeminiAIProvider } from './gemini';
import { GmailProvider, GoogleCalendarProvider } from './google';
import { NotionCaptureProvider, NotionTaskProvider } from './notion';

export { connectGoogle } from './googleAuth';
export type { GoogleToken } from './googleAuth';

export interface LiveConfig {
  googleClientId?: string;
  googleAccessToken?: string;
  notionToken?: string;
  geminiKey?: string;
  taskDatabaseId?: string;
}

const GOOGLE_NOT_CONNECTED =
  'Google not connected — add a Client ID and connect in Settings.';
const NOTION_NOT_CONNECTED =
  'Notion not connected — add an integration token in Settings.';
const GEMINI_NOT_CONNECTED =
  'AI not configured — add a Gemini API key in Settings.';

// ── Inline fallbacks ──────────────────────────────────────────────────────
// Surface a helpful error on reads; degrade gracefully (no throw) on writes.

class DisconnectedCalendar implements CalendarProvider {
  async getTodayEvents(): Promise<CalendarEvent[]> {
    throw new Error(GOOGLE_NOT_CONNECTED);
  }
}

class DisconnectedMail implements MailProvider {
  async getNeedsReply(): Promise<EmailThread[]> {
    throw new Error(GOOGLE_NOT_CONNECTED);
  }
}

class DisconnectedTasks implements TaskProvider {
  async getTodayTasks(): Promise<Task[]> {
    return [];
  }
  async setTaskStatus(): Promise<void> {
    throw new Error(NOTION_NOT_CONNECTED);
  }
}

class DisconnectedCapture implements CaptureProvider {
  async listDatabases(): Promise<NotionDatabase[]> {
    throw new Error(NOTION_NOT_CONNECTED);
  }
  async createCapture(): Promise<CaptureResult> {
    return { ok: false, error: NOTION_NOT_CONNECTED };
  }
}

class DisconnectedAI implements AIProvider {
  async tagCapture(text: string): Promise<AISuggestion> {
    return { tags: [], title: text.slice(0, 80) };
  }
  async summarizeDay(briefing: Briefing): Promise<string> {
    const events = briefing.events.length;
    const replies = briefing.needsReply.length;
    const tasks = briefing.tasks.filter((t) => t.status !== 'done').length;
    return (
      `You have ${events} event${events === 1 ? '' : 's'}, ` +
      `${replies} email${replies === 1 ? '' : 's'} to reply to, and ` +
      `${tasks} open task${tasks === 1 ? '' : 's'} today. ` +
      `(${GEMINI_NOT_CONNECTED})`
    );
  }
}

/**
 * Build a full ProviderBundle from whatever credentials are present.
 * Never throws at construction: missing sources get a graceful fallback.
 */
export function createLiveProviders(cfg: LiveConfig): ProviderBundle {
  const calendar: CalendarProvider = cfg.googleAccessToken
    ? new GoogleCalendarProvider(cfg.googleAccessToken)
    : new DisconnectedCalendar();

  const mail: MailProvider = cfg.googleAccessToken
    ? new GmailProvider(cfg.googleAccessToken)
    : new DisconnectedMail();

  const tasks: TaskProvider = cfg.notionToken
    ? new NotionTaskProvider(cfg.notionToken, cfg.taskDatabaseId)
    : new DisconnectedTasks();

  const capture: CaptureProvider = cfg.notionToken
    ? new NotionCaptureProvider(cfg.notionToken)
    : new DisconnectedCapture();

  const ai: AIProvider = cfg.geminiKey
    ? new GeminiAIProvider(cfg.geminiKey)
    : new DisconnectedAI();

  return { calendar, mail, tasks, capture, ai };
}
