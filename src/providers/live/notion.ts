import type {
  CaptureProvider,
  CaptureResult,
  TaskProvider,
} from '@/providers/contracts';
import type {
  CaptureItem,
  NotionDatabase,
  Task,
  TaskStatus,
} from '@/types';

// Raw Notion JSON is typed loosely; we narrow as we map into domain models.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type NotionAction =
  | 'search'
  | 'queryDatabase'
  | 'retrieveDatabase'
  | 'createPage'
  | 'updatePage';

/** POST to our serverless proxy, which forwards to api.notion.com. */
async function callNotion(
  token: string,
  action: NotionAction,
  payload?: Json,
): Promise<Json> {
  const res = await fetch('/api/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, action, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Notion request failed (${res.status})`;
    throw new Error(String(message));
  }
  return data;
}

function plainTextFromTitle(title: Json[] | undefined): string {
  if (!Array.isArray(title)) return '';
  return title
    .map((t) => (typeof t?.plain_text === 'string' ? t.plain_text : ''))
    .join('')
    .trim();
}

/** Find the key of the property whose type matches, scanning a properties map. */
function findPropByType(
  properties: Json,
  type: string,
): { key: string; value: Json } | null {
  if (!properties || typeof properties !== 'object') return null;
  for (const [key, value] of Object.entries(properties)) {
    if ((value as Json)?.type === type) return { key, value };
  }
  return null;
}

export class NotionCaptureProvider implements CaptureProvider {
  constructor(private readonly token: string) {}

  async listDatabases(): Promise<NotionDatabase[]> {
    const data = await callNotion(this.token, 'search', {
      filter: { value: 'database', property: 'object' },
      page_size: 50,
    });
    const results: Json[] = Array.isArray(data?.results) ? data.results : [];
    return results
      .filter((r) => r?.object === 'database')
      .map((db) => this.mapDatabase(db));
  }

  private mapDatabase(db: Json): NotionDatabase {
    const title = plainTextFromTitle(db?.title);
    let icon: string | undefined;
    if (db?.icon?.type === 'emoji' && typeof db.icon.emoji === 'string') {
      icon = db.icon.emoji;
    }
    return {
      id: String(db?.id),
      title: title || 'Untitled',
      icon,
    };
  }

  async createCapture(item: CaptureItem): Promise<CaptureResult> {
    try {
      const databaseId = item.targetDatabaseId;
      if (!databaseId) {
        return { ok: false, error: 'No target database selected.' };
      }

      // Discover the title property name (and whether a "Tags" multi_select exists).
      const db = await callNotion(this.token, 'retrieveDatabase', {
        id: databaseId,
      });
      const properties: Json = db?.properties ?? {};
      const titleProp = findPropByType(properties, 'title');
      if (!titleProp) {
        return {
          ok: false,
          error: 'Could not find a title property on the target database.',
        };
      }

      const pageProps: Json = {
        [titleProp.key]: {
          title: [{ text: { content: item.text } }],
        },
      };

      const tagsProp = properties?.Tags;
      if (
        tagsProp?.type === 'multi_select' &&
        Array.isArray(item.tags) &&
        item.tags.length
      ) {
        pageProps.Tags = {
          multi_select: item.tags.map((name) => ({ name })),
        };
      }

      const page = await callNotion(this.token, 'createPage', {
        parent: { database_id: databaseId },
        properties: pageProps,
      });

      return {
        ok: true,
        url: typeof page?.url === 'string' ? page.url : undefined,
      };
    } catch (err) {
      return { ok: false, error: messageOf(err) };
    }
  }
}

export class NotionTaskProvider implements TaskProvider {
  constructor(
    private readonly token: string,
    private readonly taskDatabaseId?: string,
  ) {}

  async getTodayTasks(_day?: Date): Promise<Task[]> {
    if (!this.taskDatabaseId) return [];
    const data = await callNotion(this.token, 'queryDatabase', {
      databaseId: this.taskDatabaseId,
      page_size: 100,
    });
    const results: Json[] = Array.isArray(data?.results) ? data.results : [];
    return results.map((page) => this.mapTask(page));
  }

  private mapTask(page: Json): Task {
    const properties: Json = page?.properties ?? {};

    const titleProp = findPropByType(properties, 'title');
    const title = titleProp
      ? plainTextFromTitle(titleProp.value?.title)
      : '';

    return {
      id: String(page?.id),
      title: title || '(untitled)',
      status: this.readStatus(properties),
      due: this.readDue(properties),
      source: 'notion',
      databaseId: this.taskDatabaseId,
      url: typeof page?.url === 'string' ? page.url : undefined,
    };
  }

  private readStatus(properties: Json): TaskStatus {
    // Prefer an explicit "Done" checkbox.
    const done = properties?.Done;
    if (done?.type === 'checkbox') {
      return done.checkbox ? 'done' : 'todo';
    }
    // Then a "Status" status or select property.
    const status = properties?.Status;
    const name: string | undefined =
      status?.status?.name ?? status?.select?.name;
    if (typeof name === 'string') {
      const lowered = name.toLowerCase();
      if (
        lowered === 'done' ||
        lowered === 'complete' ||
        lowered === 'completed'
      ) {
        return 'done';
      }
    }
    return 'todo';
  }

  private readDue(properties: Json): string | undefined {
    const candidate = properties?.Due ?? properties?.Date;
    const start: unknown = candidate?.date?.start;
    return typeof start === 'string' ? start : undefined;
  }

  async setTaskStatus(id: string, status: TaskStatus): Promise<void> {
    // Inspect current page properties to choose the right write shape.
    const page = await callNotion(this.token, 'queryDatabase', {
      databaseId: this.taskDatabaseId,
      page_size: 100,
    }).catch(() => null);

    let pageProps: Json | undefined;
    if (page?.results) {
      const match = (page.results as Json[]).find(
        (p) => String(p?.id) === id,
      );
      pageProps = match?.properties;
    }

    const update: Json = {};
    if (pageProps?.Done?.type === 'checkbox') {
      update.Done = { checkbox: status === 'done' };
    } else if (pageProps?.Status?.type === 'status') {
      update.Status = { status: { name: status === 'done' ? 'Done' : 'To do' } };
    } else if (pageProps?.Status?.type === 'select') {
      update.Status = { select: { name: status === 'done' ? 'Done' : 'To do' } };
    } else {
      // Best-effort default: assume a Done checkbox.
      update.Done = { checkbox: status === 'done' };
    }

    await callNotion(this.token, 'updatePage', {
      id,
      properties: update,
    });
  }
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === 'string' ? err : 'Unknown error';
}
