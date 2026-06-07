import { useMemo } from 'react';
import { getProviders } from '@/providers';
import type { ProviderBundle } from '@/providers/contracts';
import { useSettings } from './settings';

// Builds the active provider bundle and keeps it stable until the inputs
// that actually affect data sourcing change.
export function useProviders(): ProviderBundle {
  const { settings } = useSettings();
  const key = [
    settings.providerMode,
    settings.google.clientId,
    settings.google.accessToken ?? '',
    settings.notionToken,
    settings.geminiKey,
    settings.taskDatabaseId,
  ].join('|');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getProviders(settings), [key]);
}
