import { endOfDay, startOfDay } from 'date-fns';

import type { CalendarProvider, MailProvider } from '@/providers/contracts';
import type { CalendarEvent, EmailThread } from '@/types';

// Raw Google JSON is typed loosely; we narrow as we map into domain models.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// A small palette of stable accent colours, picked deterministically per event.
const EVENT_COLORS = [
  '#4285F4',
  '#34A853',
  '#FBBC05',
  '#EA4335',
  '#A142F4',
  '#24C1E0',
];

function stableColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return EVENT_COLORS[hash % EVENT_COLORS.length];
}

async function fetchJson(url: string, accessToken: string): Promise<Json> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Google API request failed (${res.status} ${res.statusText})${
        text ? `: ${text.slice(0, 200)}` : ''
      }`,
    );
  }
  return res.json();
}

export class GoogleCalendarProvider implements CalendarProvider {
  constructor(private readonly accessToken: string) {}

  async getTodayEvents(day?: Date): Promise<CalendarEvent[]> {
    const base = day ?? new Date();
    const timeMin = startOfDay(base).toISOString();
    const timeMax = endOfDay(base).toISOString();

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;

    const data = await fetchJson(url, this.accessToken);
    const items: Json[] = Array.isArray(data?.items) ? data.items : [];
    return items.map((item) => this.mapEvent(item));
  }

  private mapEvent(item: Json): CalendarEvent {
    const id: string = String(item?.id ?? crypto.randomUUID());
    const allDay = Boolean(item?.start?.date && !item?.start?.dateTime);

    const start: string = allDay
      ? new Date(`${item.start.date}T00:00:00`).toISOString()
      : String(item?.start?.dateTime ?? new Date().toISOString());
    const end: string = allDay
      ? new Date(`${item?.end?.date ?? item.start.date}T00:00:00`).toISOString()
      : String(item?.end?.dateTime ?? start);

    let meetingUrl: string | undefined =
      typeof item?.hangoutLink === 'string' ? item.hangoutLink : undefined;
    if (!meetingUrl) {
      const entryPoints: Json[] = item?.conferenceData?.entryPoints ?? [];
      const video = entryPoints.find((ep) => ep?.entryPointType === 'video');
      if (video?.uri) meetingUrl = String(video.uri);
    }

    const attendees: string[] | undefined = Array.isArray(item?.attendees)
      ? item.attendees
          .map((a: Json) => a?.email)
          .filter((e: unknown): e is string => typeof e === 'string')
      : undefined;

    return {
      id,
      title: String(item?.summary ?? '(no title)'),
      start,
      end,
      allDay,
      location:
        typeof item?.location === 'string' ? item.location : undefined,
      meetingUrl,
      attendees: attendees && attendees.length ? attendees : undefined,
      color: stableColor(id),
    };
  }
}

export class GmailProvider implements MailProvider {
  constructor(private readonly accessToken: string) {}

  async getNeedsReply(): Promise<EmailThread[]> {
    const query = 'in:inbox is:unread -category:promotions -category:social newer_than:14d';
    const listParams = new URLSearchParams({ q: query, maxResults: '15' });
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`;

    const list = await fetchJson(listUrl, this.accessToken);
    const messages: Json[] = Array.isArray(list?.messages) ? list.messages : [];

    const details = await Promise.all(
      messages.map((m) => this.fetchMessage(String(m?.id))),
    );

    return details.filter((t): t is EmailThread => t !== null);
  }

  private async fetchMessage(id: string): Promise<EmailThread | null> {
    if (!id) return null;
    const params = new URLSearchParams();
    params.set('format', 'metadata');
    params.append('metadataHeaders', 'Subject');
    params.append('metadataHeaders', 'From');
    params.append('metadataHeaders', 'Date');
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?${params.toString()}`;

    const msg = await fetchJson(url, this.accessToken);
    const headers: Json[] = msg?.payload?.headers ?? [];
    const header = (name: string): string | undefined => {
      const found = headers.find(
        (h) => String(h?.name).toLowerCase() === name.toLowerCase(),
      );
      return found?.value ? String(found.value) : undefined;
    };

    const fromRaw = header('From') ?? '';
    const { name, email } = parseFrom(fromRaw);

    const receivedAt = this.resolveReceivedAt(msg, header('Date'));

    return {
      id,
      subject: header('Subject') ?? '(no subject)',
      from: { name, email },
      snippet: typeof msg?.snippet === 'string' ? msg.snippet : '',
      receivedAt,
      unread: true,
      importance: 'normal',
      link: `https://mail.google.com/mail/u/0/#all/${id}`,
    };
  }

  private resolveReceivedAt(msg: Json, dateHeader?: string): string {
    const internal = msg?.internalDate;
    if (internal != null) {
      const ms = Number(internal);
      if (Number.isFinite(ms) && ms > 0) {
        return new Date(ms).toISOString();
      }
    }
    if (dateHeader) {
      const parsed = new Date(dateHeader);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  }
}

function parseFrom(raw: string): { name: string; email: string } {
  const trimmed = raw.trim();
  // Common form: "Display Name" <addr@example.com>
  const angle = trimmed.match(/^(.*?)<([^>]+)>$/);
  if (angle) {
    const name = angle[1].trim().replace(/^"|"$/g, '');
    const email = angle[2].trim();
    return { name: name || email, email };
  }
  // Bare address.
  return { name: trimmed, email: trimmed };
}
