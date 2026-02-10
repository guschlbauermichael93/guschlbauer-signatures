'use client';

import { useMemo, useState } from 'react';
import { renderTemplate, AzureADUser } from '@guschlbauer/shared';

// Fallback-User wenn keine Users geladen
const FALLBACK_USER: AzureADUser = {
  id: 'demo',
  displayName: 'Max Mustermann',
  givenName: 'Max',
  surname: 'Mustermann',
  mail: 'max.mustermann@guschlbauer.at',
  jobTitle: 'Produktionsleiter',
  department: 'Produktion',
  mobilePhone: '+43 664 123 4567',
  businessPhones: ['+43 7242 51234-10'],
  officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
  companyName: 'Guschlbauer Backwaren GmbH',
};

interface AssetData {
  id: string;
  base64Data: string;
  mimeType: string;
}

interface SignaturePreviewProps {
  htmlContent: string;
  user?: AzureADUser;
  users?: AzureADUser[];
  assets?: AssetData[];
}

export function SignaturePreview({ htmlContent, user, users = [], assets = [] }: SignaturePreviewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || '');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const activeUser = useMemo(() => {
    if (selectedUserId && users.length > 0) {
      return users.find(u => u.id === selectedUserId) || users[0] || FALLBACK_USER;
    }
    return user || (users.length > 0 ? users[0] : FALLBACK_USER);
  }, [selectedUserId, users, user]);

  const renderedHtml = useMemo(() => {
    let html = renderTemplate(htmlContent, activeUser);

    // Asset-Platzhalter durch echte Bilder ersetzen
    for (const asset of assets) {
      const pattern = new RegExp(`\\{\\{${asset.id}\\}\\}`, 'g');
      const src = asset.base64Data.startsWith('data:')
        ? asset.base64Data
        : `data:${asset.mimeType};base64,${asset.base64Data}`;
      html = html.replace(pattern, src);
    }

    // Fallback: verbleibende {{...}} Platzhalter für Assets entfernen
    html = html.replace(/\{\{(logo|banner|icon)[^}]*\}\}/g, '');

    return html;
  }, [htmlContent, activeUser, assets]);

  return (
    <div className="space-y-4">
      {/* User Selector */}
      {users.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vorschau-Mitarbeiter
          </label>
          <select
            value={selectedUserId || activeUser.id}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-wheat-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} - {u.jobTitle || 'Mitarbeiter'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mail Preview Container */}
      <div
        className="border border-gray-200 rounded-lg overflow-hidden mx-auto transition-all duration-300"
        style={{ maxWidth: device === 'mobile' ? '375px' : '100%' }}
      >
        {/* Fake Mail Header */}
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Von:</span>
            <span className="text-gray-900">{activeUser.displayName} &lt;{activeUser.mail}&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="text-gray-500">An:</span>
            <span className="text-gray-700">empfaenger@beispiel.at</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="text-gray-500">Betreff:</span>
            <span className="text-gray-900">Beispiel-Email</span>
          </div>
        </div>

        {/* Mail Body */}
        <div className="p-4 bg-white">
          <p className="text-gray-700 mb-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
            Sehr geehrte Damen und Herren,
            <br /><br />
            vielen Dank für Ihre Anfrage. Gerne sende ich Ihnen die gewünschten Informationen zu.
            <br /><br />
            Mit freundlichen Grüßen
          </p>

          {/* Signature */}
          <div
            className="signature-preview mt-4 pt-4 border-t border-gray-100"
            style={{ overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>

      {/* Device Selector */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setDevice('desktop')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            device === 'desktop'
              ? 'bg-brand-100 text-brand-700'
              : 'text-gray-600 hover:bg-wheat-100'
          }`}
        >
          Desktop
        </button>
        <button
          onClick={() => setDevice('mobile')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            device === 'mobile'
              ? 'bg-brand-100 text-brand-700'
              : 'text-gray-600 hover:bg-wheat-100'
          }`}
        >
          Mobile
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Die Vorschau zeigt, wie die Signatur in Outlook erscheint
      </p>
    </div>
  );
}
