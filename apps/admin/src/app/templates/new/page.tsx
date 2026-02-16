'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { SignatureEditor } from '@/components/signature-editor';
import { SignaturePreview } from '@/components/signature-preview';
import { TEMPLATE_PLACEHOLDERS, AzureADUser } from '@guschlbauer/shared';

const DEFAULT_TEMPLATE = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid #ed751d; vertical-align: top;">
      <img src="{{logo}}" alt="Guschlbauer" width="120" style="display: block;" />
    </td>
    <td style="padding-left: 15px; vertical-align: top;">
      <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 16px; color: #1a1a1a;">
        {{displayName}}
      </p>
      <p style="margin: 0 0 10px 0; color: #ed751d; font-size: 13px;">
        {{jobTitle}}
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6;">
        <strong>Guschlbauer Backwaren GmbH</strong><br />
        {{officeLocation}}<br />
        Tel: {{businessPhones}}<br />
        Mobil: {{mobilePhone}}<br />
        E-Mail: {{mail}}
      </p>
      <p style="margin: 15px 0 0 0; font-size: 11px; color: #888888;">
        Seit 1919 - Tradition trifft Qualität
      </p>
    </td>
  </tr>
</table>`;

const DEFAULT_REPLY_TEMPLATE = `<p style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; margin: 0;">
  Freundliche Gr&uuml;&szlig;e<br />
  <strong>{{displayName}}</strong>
</p>`;

export default function NewTemplatePage() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState(DEFAULT_TEMPLATE);
  const [htmlContentReply, setHtmlContentReply] = useState(DEFAULT_REPLY_TEMPLATE);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AzureADUser[]>([]);
  const [assets, setAssets] = useState<{ id: string; base64Data: string; mimeType: string }[]>([]);

  useEffect(() => {
    async function loadPreviewData() {
      try {
        const [usersRes, assetsRes] = await Promise.all([
          authFetch('/api/users'),
          authFetch('/api/assets'),
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.items || []);
        }
        if (assetsRes.ok) {
          const data = await assetsRes.json();
          setAssets((data.items || []).map((a: any) => ({
            id: a.id,
            base64Data: a.base64Data,
            mimeType: a.mimeType,
          })));
        }
      } catch (err) {
        console.error('Preview-Daten laden fehlgeschlagen:', err);
      }
    }
    loadPreviewData();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Bitte geben Sie einen Namen ein.');
      return;
    }
    if (!htmlContent.trim()) {
      setError('Bitte geben Sie HTML-Inhalt ein.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await authFetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, htmlContent, htmlContentReply: htmlContentReply || undefined, isDefault }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-wheat-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <a href="/" className="text-gray-500 hover:text-brand-600">Dashboard</a>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <a href="/templates" className="text-gray-500 hover:text-brand-600">Vorlagen</a>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Neue Vorlage</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Neue Signatur-Vorlage</h1>
          <div className="flex gap-3">
            <a
              href="/"
              className="px-4 py-2 border border-wheat-300 text-gray-700 rounded-lg 
                         hover:bg-wheat-100 transition-colors"
            >
              Abbrechen
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg
                         hover:bg-brand-600 transition-colors font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Editor */}
          <div className="space-y-6">
            {/* Meta */}
            <div className="bg-white rounded-xl border border-wheat-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Standard Signatur"
                    className="w-full px-3 py-2 border border-wheat-300 rounded-lg 
                               focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kurze Beschreibung der Vorlage"
                    className="w-full px-3 py-2 border border-wheat-300 rounded-lg 
                               focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-brand-500 border-wheat-300 rounded 
                               focus:ring-brand-500"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Als Standard-Signatur festlegen
                  </label>
                </div>
              </div>
            </div>

            {/* HTML Editor */}
            <div className="bg-white rounded-xl border border-wheat-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">HTML Template</h2>
                <div className="text-xs text-gray-500">
                  Platzhalter werden automatisch ersetzt
                </div>
              </div>
              <SignatureEditor
                value={htmlContent}
                onChange={setHtmlContent}
                replyValue={htmlContentReply}
                onReplyChange={setHtmlContentReply}
              />
            </div>

            {/* Placeholder Reference */}
            <div className="bg-white rounded-xl border border-wheat-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verfügbare Platzhalter
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TEMPLATE_PLACEHOLDERS).map(([key, placeholder]) => (
                  <button
                    key={key}
                    onClick={() => {
                      navigator.clipboard.writeText(placeholder);
                    }}
                    className="text-left px-3 py-2 bg-wheat-50 rounded-lg text-sm 
                               hover:bg-brand-50 hover:text-brand-700 transition-colors 
                               font-mono"
                    title="Klicken zum Kopieren"
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl border border-wheat-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vorschau</h2>
              <SignaturePreview htmlContent={htmlContent} users={users} assets={assets} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
