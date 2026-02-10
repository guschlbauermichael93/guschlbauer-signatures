'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';

interface User {
  id: string;
  displayName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  assignedTemplateId: string;
  assignedTemplateName: string;
}

interface Template {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'mock' | 'azure-ad'>('mock');
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, templatesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/templates'),
      ]);

      const usersData = await usersRes.json();
      const templatesData = await templatesRes.json();

      setUsers(usersData.items || []);
      setSource(usersData.source || 'mock');
      setTemplates(templatesData.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (userEmail: string, templateId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, templateId }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error assigning template:', error);
    }
  };

  const handlePreview = async (user: User) => {
    setPreviewUser(user);
    try {
      const res = await fetch(`/api/signature?email=${encodeURIComponent(user.mail)}`);
      const data = await res.json();
      setPreviewHtml(data.html || '');
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewHtml('<p>Fehler beim Laden der Vorschau</p>');
    }
  };

  return (
    <div className="min-h-screen bg-wheat-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter</h1>
          <p className="mt-2 text-gray-600">
            Übersicht aller Mitarbeiter und deren Signatur-Zuweisungen.
          </p>
          {source === 'mock' && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 
                            rounded-full text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Demo-Daten (Azure AD nicht konfiguriert)
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-wheat-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Wird geladen...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-wheat-50 border-b border-wheat-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Mitarbeiter
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Abteilung
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Signatur-Vorlage
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wheat-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-wheat-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-500">{user.mail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{user.jobTitle || '-'}</p>
                        <p className="text-sm text-gray-500">{user.department || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.assignedTemplateId}
                        onChange={(e) => handleTemplateChange(user.mail, e.target.value)}
                        className="px-3 py-1.5 border border-wheat-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handlePreview(user)}
                        className="text-brand-600 hover:text-brand-800 text-sm font-medium"
                      >
                        Vorschau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Preview Modal */}
        {previewUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-wheat-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Signatur-Vorschau
                  </h2>
                  <p className="text-sm text-gray-500">{previewUser.displayName}</p>
                </div>
                <button
                  onClick={() => setPreviewUser(null)}
                  className="p-2 hover:bg-wheat-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div 
                  className="signature-preview border border-gray-200 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
