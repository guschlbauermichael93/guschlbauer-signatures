'use client';

import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', match: (p: string) => p === '/' },
  { href: '/templates', label: 'Vorlagen', match: (p: string) => p.startsWith('/templates') },
  { href: '/users', label: 'Mitarbeiter', match: (p: string) => p.startsWith('/users') },
  { href: '/assets', label: 'Assets', match: (p: string) => p.startsWith('/assets') },
];

export function Header() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const user = accounts[0];

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ['User.Read', 'User.Read.All'],
    });
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };

  return (
    <header className="bg-white border-b border-wheat-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Guschlbauer</h1>
                <p className="text-xs text-gray-500">Signatur Manager</p>
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = item.match(pathname);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600'
                      : 'text-gray-500 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-wheat-100
                             transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center
                                  justify-center text-brand-700 font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700">
                    {user?.name || 'User'}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg
                                  border border-wheat-200 py-1">
                    <div className="px-4 py-2 border-b border-wheat-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700
                                 hover:bg-wheat-50"
                    >
                      Abmelden
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg
                           hover:bg-brand-600 transition-colors font-medium text-sm"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
