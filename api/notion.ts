import type { VercelRequest, VercelResponse } from '@vercel/node';

const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

type NotionAction =
  | 'search'
  | 'queryDatabase'
  | 'retrieveDatabase'
  | 'createPage'
  | 'updatePage';

interface NotionRequestBody {
  token?: string;
  action?: NotionAction;
  // Raw Notion payloads vary by action; kept loose intentionally.
  payload?: Record<string, unknown>;
}

interface NotionCall {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  body?: unknown;
}

function resolveCall(
  action: NotionAction,
  payload: Record<string, unknown> | undefined,
): NotionCall | { error: string } {
  const p = payload ?? {};
  switch (action) {
    case 'search':
      return { method: 'POST', path: '/search', body: p };
    case 'queryDatabase': {
      const databaseId = p.databaseId;
      if (typeof databaseId !== 'string') {
        return { error: 'queryDatabase requires payload.databaseId' };
      }
      const query: Record<string, unknown> = { ...p };
      delete query.databaseId;
      return {
        method: 'POST',
        path: `/databases/${databaseId}/query`,
        body: query,
      };
    }
    case 'retrieveDatabase': {
      const id = p.id;
      if (typeof id !== 'string') {
        return { error: 'retrieveDatabase requires payload.id' };
      }
      return { method: 'GET', path: `/databases/${id}` };
    }
    case 'createPage':
      return { method: 'POST', path: '/pages', body: p };
    case 'updatePage': {
      const id = p.id;
      if (typeof id !== 'string') {
        return { error: 'updatePage requires payload.id' };
      }
      const rest: Record<string, unknown> = { ...p };
      delete rest.id;
      return { method: 'PATCH', path: `/pages/${id}`, body: rest };
    }
    default:
      return { error: `Unsupported action: ${String(action)}` };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body: NotionRequestBody =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const { token, action, payload } = body;

    if (!token) {
      res.status(400).json({ error: 'Missing Notion token' });
      return;
    }
    if (!action) {
      res.status(400).json({ error: 'Missing action' });
      return;
    }

    const call = resolveCall(action, payload);
    if ('error' in call) {
      res.status(400).json({ error: call.error });
      return;
    }

    const notionRes = await fetch(`${NOTION_BASE}${call.path}`, {
      method: call.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body:
        call.method === 'GET' ? undefined : JSON.stringify(call.body ?? {}),
    });

    const data = await notionRes.json().catch(() => ({}));
    res.status(notionRes.status).json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Notion proxy request failed';
    res.status(500).json({ error: message });
  }
}
