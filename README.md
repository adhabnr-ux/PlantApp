# Cockpit

> Your personal daily command center — glance at your day, then capture every thought.

Cockpit is a personal daily command-center built as an **installable PWA** (Progressive Web App). It pulls your calendar, email and tasks into a single morning view and gives you an always-on capture bar to dump thoughts, tasks and links — routed straight into Notion with AI-suggested tags.

It runs **out of the box in mock mode** with realistic demo data and **no credentials**, so you can try the whole experience instantly. Connect real services whenever you're ready.

---

## Features

- **Morning Briefing** — one screen showing today's calendar events, emails that need a reply, and today's tasks.
- **All-day Capture** — an always-present capture bar to dump a thought, task or link from anywhere in the app.
- **AI tagging & day summary** — Gemini suggests tags (and a clean title + destination database) for each capture, and writes a one-paragraph "summarize my day" briefing on demand.
- **Routed into Notion** — captures become pages in the Notion database you choose.
- **"Right now" focus card** — your next event with a live countdown and your single top priority, pinned atop the briefing.
- **Smart capture parsing** — detects links, infers type (task / idea / link / note), and reads natural-language due dates like "tomorrow 3pm".
- **Voice capture** — tap the mic and dictate a capture hands-free (Web Speech API).
- **Offline-first queue** — captures made with no signal are queued and auto-sync the moment you reconnect.
- **Share target** — share a link or text from any app's share sheet straight into Cockpit's capture composer.
- **Daily Shutdown** — an evening review: what got done, what rolls over to tomorrow, plus a reflection + plan journal.
- **Search** — filter your recent captures by text, tag, or destination.
- **Installable & offline PWA** — add it to your home screen; it runs full-screen and keeps your briefing data cached for offline viewing.
- **Works out-of-the-box** — fully functional mock providers mean zero setup to start.

---

## Tech stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server + build)
- **Tailwind CSS v4**
- **vite-plugin-pwa** (service worker, manifest, offline caching)
- **@google/genai** (Google Gemini) for AI tagging & summaries
- **Vercel serverless functions** (`/api`) as proxies for browser-blocked calls
- Deploy target: **Vercel**

---

## Getting started

### Prerequisites

- **Node.js 18+** and npm

### Run it

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

That's it. Cockpit starts in **mock mode** with realistic demo calendar, email, task and Notion data — **no API keys, OAuth or accounts required**. Everything is interactive: browse the briefing, run the AI summary, and use the capture bar. Switch on live integrations only when you want your real data.

---

## Going live

Every data source sits behind a provider interface with both a **mock** and a **live** implementation. To connect real services, open **Settings** in the app and fill in the credentials below. Each integration is independent — enable only the ones you want.

> **Where your tokens live:** This is a personal, single-user app, so credentials are stored in your browser's **`localStorage`** — not on a server. Calls that browsers can't make directly (Notion's CORS restrictions, OAuth exchanges) are proxied through **`/api` serverless functions**.

### Google (Calendar + Gmail)

Cockpit reads your calendar and inbox using **read-only** scopes (`calendar.readonly`, `gmail.readonly`).

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and **create a project**.
2. Under **APIs & Services → Library**, enable the **Google Calendar API** and the **Gmail API**.
3. Under **APIs & Services → Credentials**, create an **OAuth client ID** of type **Web application**.
4. Add your app's URL(s) to **Authorized JavaScript origins** — e.g. `http://localhost:3000` for local dev and your Vercel URL for production.
5. Copy the **Client ID** and paste it into **Settings** in the app.

### Notion (tasks + capture)

1. Create an **internal integration** at [notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Copy the integration's **token**.
3. **Share** each target database with the integration (open the database → ••• menu → **Connections** / **Add connections** → select your integration). This applies to both databases you read tasks from and databases you capture into.
4. Paste the **token** into **Settings** in the app.

> Notion blocks direct browser requests (CORS), so Cockpit routes all Notion reads and page creation through the `/api` serverless proxy.

### Gemini (AI tagging & summaries)

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Paste it into **Settings** in the app — or provide it as the **`GEMINI_API_KEY`** environment variable (see below).

---

## Install on your phone (PWA)

Cockpit is a full Progressive Web App, so you can install it like a native app.

1. **Get it on a URL.** Deploy to Vercel (recommended), or build and preview locally:
   ```bash
   npm run build
   npm run preview
   ```
2. **Open the URL on your phone** in the browser:
   - **iOS (Safari):** tap **Share** → **Add to Home Screen**.
   - **Android (Chrome):** tap the **⋮** menu → **Install app** / **Add to Home Screen**.
3. Launch it from your home screen. It runs **full-screen** (no browser chrome) and **works offline** — your morning briefing data is cached so it's available even without a connection.

---

## Deployment

Cockpit is built to deploy to **Vercel**:

```bash
npm run build
```

Push the repo to Vercel (or run `vercel`). The serverless functions in **`/api`** deploy automatically alongside the static frontend — no extra configuration needed.

To enable AI features server-side, set the **`GEMINI_API_KEY`** environment variable in your Vercel project settings (Project → Settings → Environment Variables). Alternatively, users can enter the key in the app's Settings.

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional | Enables AI tagging & day summaries. Can also be entered in-app under **Settings**. |

See [`.env.example`](./.env.example) for a template. Copy it to `.env` to set values locally.

---

## Project structure

```
.
├── api/                  # Vercel serverless functions (proxies for Notion CORS / OAuth)
├── src/
│   ├── providers/        # Data-source provider layer
│   │   ├── contracts.ts  #   provider interfaces (Calendar, Mail, Task, Capture, AI)
│   │   ├── mock/         #   mock providers — default, no credentials needed
│   │   └── live/         #   live providers — Google, Notion, Gemini
│   ├── features/         # UI features
│   │   ├── briefing/     #   Morning Briefing screen
│   │   ├── capture/      #   All-day capture bar
│   │   └── settings/     #   Credentials & integration toggles
│   └── types.ts          # Shared, provider-agnostic domain models
├── vite.config.ts        # Vite + Tailwind + PWA config
└── package.json
```

Each data source is accessed only through its **contract** in `src/providers/contracts.ts`, which has a `mock` and a `live` implementation. The app picks a `ProviderMode` (`'mock'` | `'live'`) so the UI never depends on any specific backend.

---

## License

[MIT](./LICENSE)
