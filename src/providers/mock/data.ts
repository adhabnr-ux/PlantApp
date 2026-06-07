import { addDays, set } from 'date-fns';
import type {
  CalendarEvent,
  EmailThread,
  NotionDatabase,
  Task,
} from '@/types';

// Helpers to anchor demo data to "today" so the briefing always looks current.
const at = (h: number, m = 0): string =>
  set(new Date(), { hours: h, minutes: m, seconds: 0, milliseconds: 0 }).toISOString();

const hoursAgo = (h: number): string =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

export const mockEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Standup',
    start: at(9, 30),
    end: at(9, 45),
    allDay: false,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    attendees: ['alex@team.com', 'sam@team.com', 'you@team.com'],
    color: '#6366f1',
  },
  {
    id: 'evt-2',
    title: 'Design review — Q3 dashboard',
    start: at(11, 0),
    end: at(12, 0),
    allDay: false,
    location: 'Room 4B',
    attendees: ['lee@team.com', 'you@team.com'],
    color: '#0ea5e9',
  },
  {
    id: 'evt-3',
    title: 'Lunch with Priya',
    start: at(13, 0),
    end: at(14, 0),
    allDay: false,
    location: 'Café Verde',
    color: '#f59e0b',
  },
  {
    id: 'evt-4',
    title: '1:1 with manager',
    start: at(16, 0),
    end: at(16, 30),
    allDay: false,
    meetingUrl: 'https://zoom.us/j/1234567890',
    attendees: ['morgan@team.com', 'you@team.com'],
    color: '#10b981',
  },
];

export const mockEmails: EmailThread[] = [
  {
    id: 'mail-1',
    subject: 'Re: Contract renewal — need your sign-off',
    from: { name: 'Dana Whitfield', email: 'dana@acme.co' },
    snippet:
      "Hi — just circling back on the renewal terms we discussed. Could you confirm the seat count so legal can finalise? We'd love to wrap this up this week.",
    receivedAt: hoursAgo(2),
    unread: true,
    importance: 'high',
    link: 'https://mail.google.com/mail/u/0/#inbox/mail-1',
  },
  {
    id: 'mail-2',
    subject: 'Quick question about the onboarding flow',
    from: { name: 'Jordan Lee', email: 'jordan@startup.io' },
    snippet:
      'Loving the product so far! One thing — is there a way to bulk-invite teammates? Couldn’t find it in the docs.',
    receivedAt: hoursAgo(5),
    unread: true,
    importance: 'normal',
    link: 'https://mail.google.com/mail/u/0/#inbox/mail-2',
  },
  {
    id: 'mail-3',
    subject: 'Podcast invite — would love to have you on',
    from: { name: 'Maya Chen', email: 'maya@buildlab.fm' },
    snippet:
      'We run a weekly show on indie products and your launch caught our eye. Any interest in a 30-min recording next week?',
    receivedAt: hoursAgo(20),
    unread: false,
    importance: 'normal',
    link: 'https://mail.google.com/mail/u/0/#inbox/mail-3',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Finalise Q3 roadmap doc',
    status: 'todo',
    due: at(17, 0),
    priority: 'high',
    tags: ['planning'],
    source: 'notion',
    databaseId: 'db-tasks',
    url: 'https://notion.so/task-1',
  },
  {
    id: 'task-2',
    title: 'Reply to Dana about renewal',
    status: 'todo',
    due: at(12, 0),
    priority: 'high',
    tags: ['sales'],
    source: 'notion',
    databaseId: 'db-tasks',
    url: 'https://notion.so/task-2',
  },
  {
    id: 'task-3',
    title: 'Review pull request #482',
    status: 'todo',
    priority: 'medium',
    tags: ['eng'],
    source: 'notion',
    databaseId: 'db-tasks',
    url: 'https://notion.so/task-3',
  },
  {
    id: 'task-4',
    title: 'Book flights for the conference',
    status: 'done',
    due: addDays(new Date(), -1).toISOString(),
    priority: 'low',
    tags: ['travel'],
    source: 'notion',
    databaseId: 'db-tasks',
    url: 'https://notion.so/task-4',
  },
];

export const mockDatabases: NotionDatabase[] = [
  { id: 'db-tasks', title: 'Tasks', icon: '✅' },
  { id: 'db-ideas', title: 'Ideas', icon: '💡' },
  { id: 'db-notes', title: 'Notes', icon: '📝' },
  { id: 'db-reading', title: 'Reading list', icon: '📚' },
];
