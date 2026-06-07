import { useState, type ReactNode } from 'react';
import {
  Check,
  Database,
  Download,
  KeyRound,
  Loader2,
  RotateCcw,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import type { NotionDatabase } from '@/types';
import { useSettings } from '@/lib/settings';
import { useProviders } from '@/lib/useProviders';
import { useInstallPrompt } from '@/lib/useInstallPrompt';
import { connectGoogle } from '@/providers/live';
import { Card } from '@/components/ui';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none';

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2"
    >
      <span className="text-sm text-slate-200">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  );
}

function SettingsCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-slate-200">
        {icon}
        <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function SettingsScreen() {
  const { settings, update, reset } = useSettings();
  const providers = useProviders();
  const { canInstall, standalone, promptInstall } = useInstallPrompt();

  const [connecting, setConnecting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [databases, setDatabases] = useState<NotionDatabase[] | null>(null);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const googleConnected =
    !!settings.google.accessToken &&
    (settings.google.expiresAt ?? 0) > Date.now();

  const handleConnectGoogle = async () => {
    setGoogleError(null);
    if (!settings.google.clientId) {
      setGoogleError('Enter your Google OAuth Client ID first.');
      return;
    }
    setConnecting(true);
    try {
      const token = await connectGoogle(settings.google.clientId);
      update({ google: { ...settings.google, accessToken: token.accessToken, expiresAt: token.expiresAt } });
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Could not connect to Google.');
    } finally {
      setConnecting(false);
    }
  };

  const loadDatabases = async () => {
    setDbError(null);
    setLoadingDbs(true);
    try {
      setDatabases(await providers.capture.listDatabases());
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Could not load databases.');
    } finally {
      setLoadingDbs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect your accounts, or stay in demo mode.
        </p>
      </div>

      {/* Mode + identity */}
      <SettingsCard icon={<Sparkles className="h-4 w-4 text-indigo-400" />} title="General">
        <Field label="Your name" hint="Shown in the morning greeting.">
          <input
            className={inputClass}
            value={settings.userName}
            placeholder="e.g. Sam"
            onChange={(e) => update({ userName: e.target.value })}
          />
        </Field>
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-slate-200">Data source</span>
          <div className="grid grid-cols-2 gap-2">
            {(['mock', 'live'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update({ providerMode: mode })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  settings.providerMode === mode
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                {mode === 'mock' ? 'Demo data' : 'Live accounts'}
              </button>
            ))}
          </div>
          <span className="block text-xs text-slate-500">
            {settings.providerMode === 'mock'
              ? 'Using realistic demo data — no credentials needed.'
              : 'Using your connected Google, Notion and Gemini accounts.'}
          </span>
        </div>
      </SettingsCard>

      {/* Sources */}
      <SettingsCard icon={<Database className="h-4 w-4 text-emerald-400" />} title="Briefing sources">
        <Switch
          label="Calendar — today's events"
          checked={settings.sources.calendar}
          onChange={(v) => update({ sources: { ...settings.sources, calendar: v } })}
        />
        <Switch
          label="Email — needs reply"
          checked={settings.sources.mail}
          onChange={(v) => update({ sources: { ...settings.sources, mail: v } })}
        />
        <Switch
          label="Tasks"
          checked={settings.sources.tasks}
          onChange={(v) => update({ sources: { ...settings.sources, tasks: v } })}
        />
      </SettingsCard>

      {/* Google */}
      <SettingsCard icon={<KeyRound className="h-4 w-4 text-sky-400" />} title="Google (Calendar + Gmail)">
        <Field
          label="OAuth Client ID"
          hint="Google Cloud → Credentials → Web client. Read-only calendar & Gmail scopes."
        >
          <input
            className={inputClass}
            value={settings.google.clientId}
            placeholder="xxxxxxxx.apps.googleusercontent.com"
            onChange={(e) => update({ google: { ...settings.google, clientId: e.target.value } })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {googleConnected ? 'Reconnect' : 'Connect Google'}
          </button>
          {googleConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
              <Check className="h-4 w-4" /> Connected
            </span>
          )}
        </div>
        {googleError && (
          <p className="inline-flex items-center gap-1 text-xs text-rose-300">
            <TriangleAlert className="h-3.5 w-3.5" /> {googleError}
          </p>
        )}
      </SettingsCard>

      {/* Notion */}
      <SettingsCard icon={<Database className="h-4 w-4 text-indigo-400" />} title="Notion">
        <Field
          label="Integration token"
          hint="notion.so/my-integrations → create internal integration → share your databases with it."
        >
          <input
            className={inputClass}
            type="password"
            value={settings.notionToken}
            placeholder="secret_…"
            onChange={(e) => update({ notionToken: e.target.value })}
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDatabases}
            disabled={loadingDbs}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 disabled:opacity-50"
          >
            {loadingDbs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Load my databases
          </button>
          {dbError && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-300">
              <TriangleAlert className="h-3.5 w-3.5" /> {dbError}
            </span>
          )}
        </div>

        <Field label="Tasks database" hint="Where today's tasks are read from.">
          {databases ? (
            <select
              className={inputClass}
              value={settings.taskDatabaseId}
              onChange={(e) => update({ taskDatabaseId: e.target.value })}
            >
              <option value="">— none —</option>
              {databases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon ? `${d.icon} ` : ''}
                  {d.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={inputClass}
              value={settings.taskDatabaseId}
              placeholder="Database ID (or load databases above)"
              onChange={(e) => update({ taskDatabaseId: e.target.value })}
            />
          )}
        </Field>

        <Field label="Default capture database" hint="Where new captures go by default.">
          {databases ? (
            <select
              className={inputClass}
              value={settings.defaultCaptureDatabaseId}
              onChange={(e) => update({ defaultCaptureDatabaseId: e.target.value })}
            >
              <option value="">— first available —</option>
              {databases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon ? `${d.icon} ` : ''}
                  {d.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={inputClass}
              value={settings.defaultCaptureDatabaseId}
              placeholder="Database ID (or load databases above)"
              onChange={(e) => update({ defaultCaptureDatabaseId: e.target.value })}
            />
          )}
        </Field>
      </SettingsCard>

      {/* Gemini */}
      <SettingsCard icon={<Sparkles className="h-4 w-4 text-purple-400" />} title="AI (Gemini)">
        <Field
          label="API key"
          hint="From Google AI Studio. Powers tag suggestions & the day summary."
        >
          <input
            className={inputClass}
            type="password"
            value={settings.geminiKey}
            placeholder="AIza…"
            onChange={(e) => update({ geminiKey: e.target.value })}
          />
        </Field>
      </SettingsCard>

      {/* Install */}
      <SettingsCard icon={<Smartphone className="h-4 w-4 text-amber-400" />} title="Install on your phone">
        {standalone ? (
          <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
            <Check className="h-4 w-4" /> Installed — you're running the app.
          </p>
        ) : canInstall ? (
          <button
            type="button"
            onClick={promptInstall}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            <Download className="h-4 w-4" /> Add to home screen
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            On <span className="text-slate-200">iOS Safari</span>: tap Share → “Add to Home Screen”.
            On <span className="text-slate-200">Android Chrome</span>: menu → “Install app”.
          </p>
        )}
      </SettingsCard>

      <button
        type="button"
        onClick={() => {
          if (confirm('Reset all settings to defaults?')) reset();
        }}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-400"
      >
        <RotateCcw className="h-4 w-4" /> Reset all settings
      </button>
    </div>
  );
}
