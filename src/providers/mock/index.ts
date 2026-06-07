import { format } from 'date-fns';
import type {
  AIProvider,
  CalendarProvider,
  CaptureProvider,
  CaptureResult,
  MailProvider,
  ProviderBundle,
  TaskProvider,
} from '../contracts';
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
import { mockDatabases, mockEmails, mockEvents, mockTasks } from './data';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class MockCalendarProvider implements CalendarProvider {
  async getTodayEvents(): Promise<CalendarEvent[]> {
    await delay(280);
    return [...mockEvents].sort((a, b) => a.start.localeCompare(b.start));
  }
}

class MockMailProvider implements MailProvider {
  async getNeedsReply(): Promise<EmailThread[]> {
    await delay(360);
    const rank = { high: 0, normal: 1, low: 2 } as const;
    return [...mockEmails].sort((a, b) => rank[a.importance] - rank[b.importance]);
  }
}

class MockTaskProvider implements TaskProvider {
  // Local mutable copy so toggles persist within the session.
  private tasks: Task[] = mockTasks.map((t) => ({ ...t }));

  async getTodayTasks(): Promise<Task[]> {
    await delay(240);
    return this.tasks.map((t) => ({ ...t }));
  }

  async setTaskStatus(id: string, status: TaskStatus): Promise<void> {
    await delay(120);
    const task = this.tasks.find((t) => t.id === id);
    if (task) task.status = status;
  }
}

class MockCaptureProvider implements CaptureProvider {
  async listDatabases(): Promise<NotionDatabase[]> {
    await delay(150);
    return [...mockDatabases];
  }

  async createCapture(item: CaptureItem): Promise<CaptureResult> {
    await delay(420);
    return { ok: true, url: `https://notion.so/mock/${item.id}` };
  }
}

// Lightweight keyword-based stand-in for the live Gemini provider.
const TAG_RULES: Array<{ test: RegExp; tags: string[] }> = [
  { test: /\b(bug|fix|error|crash|broken)\b/i, tags: ['bug'] },
  { test: /\b(idea|maybe|what if|concept)\b/i, tags: ['idea'] },
  { test: /\b(buy|order|purchase|groceries)\b/i, tags: ['shopping'] },
  { test: /\b(call|email|reply|follow.?up|ping)\b/i, tags: ['follow-up'] },
  { test: /\b(read|article|book|watch|listen)\b/i, tags: ['reading'] },
  { test: /\b(meeting|standup|sync|1:1)\b/i, tags: ['meeting'] },
  { test: /\b(urgent|asap|today|deadline)\b/i, tags: ['urgent'] },
  { test: /https?:\/\//i, tags: ['link'] },
];

function pickDatabase(text: string, databases: NotionDatabase[]): string | undefined {
  const lower = text.toLowerCase();
  const byHint = (hint: RegExp) => databases.find((d) => hint.test(d.title));
  if (/https?:\/\/|read|article|book/.test(lower)) {
    const d = byHint(/read|article/i);
    if (d) return d.id;
  }
  if (/idea|maybe|what if/.test(lower)) {
    const d = byHint(/idea/i);
    if (d) return d.id;
  }
  if (/todo|task|finish|ship|deadline/.test(lower)) {
    const d = byHint(/task/i);
    if (d) return d.id;
  }
  return databases[0]?.id;
}

class MockAIProvider implements AIProvider {
  async tagCapture(text: string, databases: NotionDatabase[]): Promise<AISuggestion> {
    await delay(500);
    const tags = new Set<string>();
    for (const rule of TAG_RULES) if (rule.test.test(text)) rule.tags.forEach((t) => tags.add(t));
    const title = text.trim().replace(/\s+/g, ' ').slice(0, 70);
    return {
      tags: [...tags],
      title,
      suggestedDatabaseId: pickDatabase(text, databases),
    };
  }

  async summarizeDay(briefing: Briefing): Promise<string> {
    await delay(650);
    const { events, needsReply, tasks } = briefing;
    const openTasks = tasks.filter((t) => t.status === 'todo');
    const next = [...events].sort((a, b) => a.start.localeCompare(b.start))[0];
    const parts: string[] = [];
    parts.push(
      `You have ${events.length} event${events.length === 1 ? '' : 's'} today` +
        (next ? `, starting with “${next.title}” at ${format(new Date(next.start), 'h:mm a')}.` : '.'),
    );
    if (needsReply.length) {
      parts.push(
        `${needsReply.length} email${needsReply.length === 1 ? '' : 's'} ${needsReply.length === 1 ? 'is' : 'are'} waiting on a reply` +
          (needsReply[0] ? ` — the most pressing is from ${needsReply[0].from.name}.` : '.'),
      );
    }
    if (openTasks.length) {
      parts.push(
        `${openTasks.length} task${openTasks.length === 1 ? '' : 's'} still open` +
          (openTasks[0] ? `; “${openTasks[0].title}” looks like the one to tackle first.` : '.'),
      );
    }
    parts.push('Have a focused, productive day. 🌅');
    return parts.join(' ');
  }
}

export function createMockProviders(): ProviderBundle {
  return {
    calendar: new MockCalendarProvider(),
    mail: new MockMailProvider(),
    tasks: new MockTaskProvider(),
    capture: new MockCaptureProvider(),
    ai: new MockAIProvider(),
  };
}
