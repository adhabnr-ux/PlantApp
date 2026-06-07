import type { Settings } from '@/lib/settings';
import type { ProviderBundle } from './contracts';
import { createMockProviders } from './mock';
import { createLiveProviders, type LiveConfig } from './live';

// Picks the active provider bundle based on the user's settings.
// `mock` is fully self-contained; `live` talks to real APIs.
export function getProviders(settings: Settings): ProviderBundle {
  if (settings.providerMode === 'live') {
    const cfg: LiveConfig = {
      googleClientId: settings.google.clientId || undefined,
      googleAccessToken: settings.google.accessToken || undefined,
      notionToken: settings.notionToken || undefined,
      geminiKey: settings.geminiKey || undefined,
      taskDatabaseId: settings.taskDatabaseId || undefined,
    };
    return createLiveProviders(cfg);
  }
  return createMockProviders();
}

export type { ProviderBundle } from './contracts';
