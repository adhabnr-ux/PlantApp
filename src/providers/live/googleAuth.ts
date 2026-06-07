// Browser-side Google OAuth helper using Google Identity Services (GIS).
// Implements the implicit token flow to obtain a short-lived access token for
// the read-only Calendar and Gmail scopes.

export interface GoogleToken {
  accessToken: string;
  expiresAt: number;
}

// ── Minimal ambient typing for the GIS global ─────────────────────────────
// We only model the slice of `google.accounts.oauth2` we actually use, to keep
// `any` localized and still type-check without @types/google.accounts.
interface GisTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GisTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GisTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
}

interface GisOAuth2 {
  initTokenClient: (config: GisTokenClientConfig) => GisTokenClient;
}

interface GisAccounts {
  oauth2: GisOAuth2;
}

interface GisGlobal {
  accounts: GisAccounts;
}

declare global {
  interface Window {
    google?: { accounts?: Partial<GisAccounts> } & Partial<GisGlobal>;
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPES =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly';

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services script.')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () =>
      reject(new Error('Failed to load Google Identity Services script.')),
    );
    document.head.appendChild(script);
  });
}

/**
 * Runs the GIS OAuth token flow in a popup and resolves with the access token.
 * Rejects on error or if the popup is closed/dismissed.
 */
export async function connectGoogle(clientId: string): Promise<GoogleToken> {
  if (!clientId) {
    throw new Error('A Google Client ID is required to connect.');
  }
  await loadGisScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Identity Services failed to initialize.');
  }

  return new Promise<GoogleToken>((resolve, reject) => {
    let settled = false;
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: GisTokenResponse) => {
        if (settled) return;
        settled = true;
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                'Google authorization failed.',
            ),
          );
          return;
        }
        const expiresIn = response.expires_in ?? 3600;
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      },
      error_callback: (error: { type?: string; message?: string }) => {
        if (settled) return;
        settled = true;
        reject(
          new Error(
            error.message ||
              (error.type === 'popup_closed'
                ? 'The Google sign-in popup was closed.'
                : 'Google authorization failed.'),
          ),
        );
      },
    });

    client.requestAccessToken({ prompt: 'consent' });
  });
}
