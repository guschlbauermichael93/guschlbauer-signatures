'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  isDefault: boolean;
  isActive: boolean;
  updatedAt: string;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authFetch = useAuthFetch();

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authFetch('/api/templates');
      if (!res.ok) throw new Error('Fehler beim Laden');
      const data = await res.json();
      setTemplates(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Vorlage "${name}" wirklich löschen?`)) return;

    try {
      const res = await authFetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-wheat-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">Vorlagen werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetchTemplates(); }}
          className="mt-3 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600
                     transition-colors text-sm"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-wheat-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-wheat-50 border-b border-wheat-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                Vorlage
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                Zuletzt bearbeitet
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wheat-100">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-wheat-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center
                                    justify-center text-brand-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5
                                           rounded-full font-medium">
                            Standard
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                    text-xs font-medium ${
                                      template.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      template.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {template.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(template.updatedAt).toLocaleDateString('de-AT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/templates/${template.id}`}
                      className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50
                                 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50
                                 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">Noch keine Vorlagen erstellt</p>
          <a
            href="/templates/new"
            className="inline-flex items-center px-4 py-2 bg-brand-500 text-white
                       rounded-lg hover:bg-brand-600 transition-colors font-medium"
          >
            Erste Vorlage erstellen
          </a>
        </div>
      )}
    </div>
  );
}
