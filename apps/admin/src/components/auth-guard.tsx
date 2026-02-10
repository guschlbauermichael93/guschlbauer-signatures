'use client';

import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { ReactNode } from 'react';

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  // In Dev-Mode: Auth überspringen
  if (DEV_MODE) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wheat-50">
        <div className="bg-white rounded-2xl shadow-lg border border-wheat-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Signatur Manager
          </h1>
          <p className="text-gray-500 mb-8">
            Bitte melden Sie sich mit Ihrem Microsoft-Konto an, um fortzufahren.
          </p>
          <button
            onClick={() => {
              instance.loginPopup({
                scopes: ['User.Read', 'User.Read.All'],
              });
            }}
            className="w-full px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
          >
            Mit Microsoft anmelden
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
