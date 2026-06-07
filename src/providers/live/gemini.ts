import { GoogleGenAI } from '@google/genai';

import type { AIProvider } from '@/providers/contracts';
import type { AISuggestion, Briefing, NotionDatabase } from '@/types';

const MODEL = 'gemini-2.5-flash';

export class GeminiAIProvider implements AIProvider {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async tagCapture(
    text: string,
    databases: NotionDatabase[],
  ): Promise<AISuggestion> {
    const fallback: AISuggestion = { tags: [], title: text.slice(0, 80) };
    try {
      const dbList = databases.map((d) => ({ id: d.id, title: d.title }));
      const prompt = [
        'You triage quick notes into a Notion workspace.',
        'Given a raw capture and a list of databases, respond with JSON of the',
        'shape { "tags": string[], "title": string, "suggestedDatabaseId": string }.',
        'Choose suggestedDatabaseId from the provided ids (or "" if none fit).',
        'Keep title under 80 chars and tags to at most 4 short lowercase keywords.',
        '',
        `Databases: ${JSON.stringify(dbList)}`,
        `Capture: ${JSON.stringify(text)}`,
      ].join('\n');

      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const raw = response.text;
      if (!raw) return fallback;

      const parsed = JSON.parse(raw) as Partial<{
        tags: unknown;
        title: unknown;
        suggestedDatabaseId: unknown;
      }>;

      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t): t is string => typeof t === 'string')
            .slice(0, 4)
        : [];
      const title =
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim().slice(0, 80)
          : text.slice(0, 80);
      const suggestedId =
        typeof parsed.suggestedDatabaseId === 'string' &&
        databases.some((d) => d.id === parsed.suggestedDatabaseId)
          ? parsed.suggestedDatabaseId
          : undefined;

      return { tags, title, suggestedDatabaseId: suggestedId };
    } catch {
      return fallback;
    }
  }

  async summarizeDay(briefing: Briefing): Promise<string> {
    try {
      const eventTitles = briefing.events.map((e) => e.title);
      const replySubjects = briefing.needsReply.map((m) => m.subject);
      const taskTitles = briefing.tasks
        .filter((t) => t.status !== 'done')
        .map((t) => t.title);

      const prompt = [
        'Write a warm, encouraging 2-3 sentence summary of the user\'s day.',
        'Be concise and specific; do not use bullet points or markdown.',
        '',
        `Date: ${briefing.date}`,
        `Events (${eventTitles.length}): ${JSON.stringify(eventTitles)}`,
        `Emails needing a reply (${replySubjects.length}): ${JSON.stringify(
          replySubjects,
        )}`,
        `Open tasks (${taskTitles.length}): ${JSON.stringify(taskTitles)}`,
      ].join('\n');

      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      });

      const text = response.text;
      if (text && text.trim()) return text.trim();
      return this.deterministicSummary(briefing);
    } catch {
      return this.deterministicSummary(briefing);
    }
  }

  private deterministicSummary(briefing: Briefing): string {
    const events = briefing.events.length;
    const replies = briefing.needsReply.length;
    const tasks = briefing.tasks.filter((t) => t.status !== 'done').length;
    return (
      `You have ${events} event${events === 1 ? '' : 's'} today, ` +
      `${replies} email${replies === 1 ? '' : 's'} waiting on a reply, and ` +
      `${tasks} open task${tasks === 1 ? '' : 's'}. ` +
      'Take it one step at a time.'
    );
  }
}
