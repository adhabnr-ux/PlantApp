import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProviderMode } from '@/providers/contracts';

// ── Persisted app settings ────────────────────────────────────────────────

export interface Settings {
  /** Used in the briefing greeting. */
  userName: string;
  /** Which provider implementations to use. */
  providerMode: ProviderMode;
  google: {
    clientId: string;
    accessToken?: string;
    /** Epoch ms when the access token expires. */
    expiresAt?: number;
  };
  notionToken: string;
  geminiKey: string;
  /** Notion database id that today's tasks are read from. */
  taskDatabaseId: string;
  /** Default Notion database new captures are routed into. */
  defaultCaptureDatabaseId: string;
  /** Per-source toggles for the briefing. */
  sources: {
    calendar: boolean;
    mail: boolean;
    tasks: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  providerMode: 'mock',
  google: { clientId: '' },
  notionToken: '',
  geminiKey: '',
  taskDatabaseId: '',
  defaultCaptureDatabaseId: '',
  sources: { calendar: true, mail: true, tasks: true },
};

const STORAGE_KEY = 'cockpit.settings.v1';

function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // Merge so newly-added fields fall back to defaults.
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      google: { ...DEFAULT_SETTINGS.google, ...parsed.google },
      sources: { ...DEFAULT_SETTINGS.sources, ...parsed.sources },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage may be unavailable (private mode); non-fatal.
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      google: { ...prev.google, ...patch.google },
      sources: { ...prev.sources, ...patch.sources },
    }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
