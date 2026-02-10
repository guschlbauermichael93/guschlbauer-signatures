'use client';

import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/**
 * Hook der einen authentifizierten fetch() wrapper bereitstellt.
 * Holt automatisch den MSAL Access Token und fügt ihn als Bearer Token hinzu.
 * In DEV_MODE wird kein Token angehängt.
 */
export function useAuthFetch() {
  const { instance, accounts } = useMsal();

  const authFetch = useCallback(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (DEV_MODE) {
      return fetch(input, init);
    }

    const account = accounts[0];
    if (!account) {
      return fetch(input, init);
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account,
      });

      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${tokenResponse.accessToken}`);

      return fetch(input, { ...init, headers });
    } catch {
      // Fallback: ohne Token fetchen
      return fetch(input, init);
    }
  }, [instance, accounts]);

  return authFetch;
}
