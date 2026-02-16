'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { SignatureEditor } from '@/components/signature-editor';
import { SignaturePreview } from '@/components/signature-preview';
import { TEMPLATE_PLACEHOLDERS, AzureADUser } from '@guschlbauer/shared';

interface Template {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
  htmlContentReply?: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const authFetch = useAuthFetch();
  const templateId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [htmlContentReply, setHtmlContentReply] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [users, setUsers] = useState<AzureADUser[]>([]);
  const [assets, setAssets] = useState<{ id: string; base64Data: string; mimeType: string }[]>([]);

  useEffect(() => {
    // Users und Assets parallel laden
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

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await authFetch(`/api/templates?id=${templateId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error('Fehler beim Laden');
        const data: Template = await res.json();
        setName(data.name);
        setDescription(data.description || '');
        setHtmlContent(data.htmlContent);
        setHtmlContentReply(data.htmlContentReply || '');
        setIsDefault(data.isDefault);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [templateId]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Bitte geben Sie einen Namen ein.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await authFetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, name, description, htmlContent, htmlContentReply: htmlContentReply || undefined, isDefault }),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-wheat-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Vorlage wird geladen...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-wheat-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">Vorlage nicht gefunden.</p>
            <a href="/" className="text-brand-600 hover:text-brand-700 font-medium">
              Zurück zum Dashboard
            </a>
          </div>
        </main>
      </div>
    );
  }

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
            <li className="text-gray-900 font-medium">Vorlage bearbeiten</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Vorlage bearbeiten</h1>
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
