'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/header';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface Asset {
  id: string;
  name: string;
  mimeType: string;
  base64Data: string;
  width?: number;
  height?: number;
  htmlTag?: string;
  createdAt: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadId, setUploadId] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadHtmlTag, setUploadHtmlTag] = useState('');
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editHtmlTag, setEditHtmlTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFetch = useAuthFetch();

  const loadAssets = useCallback(async () => {
    try {
      const res = await authFetch('/api/assets');
      const data = await res.json();
      setAssets(data.items || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^.]+$/, ''));
    setUploadId('');
    setUploadHtmlTag('');

    // Preview erstellen
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);

    setShowUploadDialog(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      if (uploadId.trim()) formData.append('customId', uploadId.trim());
      if (uploadHtmlTag.trim()) formData.append('htmlTag', uploadHtmlTag.trim());

      const res = await authFetch('/api/assets', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadAssets();
        setShowUploadDialog(false);
        setUploadFile(null);
        setUploadPreview('');
      } else {
        const error = await res.json();
        alert(error.error || 'Upload fehlgeschlagen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateHtmlTag = async (id: string, htmlTag: string) => {
    try {
      const res = await authFetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, htmlTag }),
      });
      if (res.ok) {
        await loadAssets();
        setEditingAsset(null);
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleReplaceLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('id', 'logo');
      formData.append('file', file);

      const res = await authFetch('/api/assets', {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        await loadAssets();
        alert('Logo erfolgreich aktualisiert!');
      } else {
        const error = await res.json();
        alert(error.error || 'Update fehlgeschlagen');
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Asset wirklich löschen?')) return;

    try {
      const res = await authFetch(`/api/assets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAssets();
      } else {
        const error = await res.json();
        alert(error.error || 'Löschen fehlgeschlagen');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const logoAsset = assets.find(a => a.id === 'logo');
  const otherAssets = assets.filter(a => a.id !== 'logo');

  return (
    <div className="min-h-screen bg-wheat-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Logos und Bilder für Ihre Signaturen.
          </p>
        </div>

        {/* Haupt-Logo */}
        <section className="bg-white rounded-xl border border-wheat-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Firmenlogo</h2>
          <p className="text-sm text-gray-500 mb-4">
            Dieses Logo wird in allen Signaturen verwendet.
          </p>

          <div className="flex items-start gap-6">
            {logoAsset && (
              <div className="border border-wheat-200 rounded-lg p-4 bg-gray-50">
                <img 
                  src={logoAsset.base64Data} 
                  alt="Logo" 
                  className="max-w-[200px] h-auto"
                />
              </div>
            )}

            <div>
              <label className="block">
                <span className="sr-only">Logo ersetzen</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleReplaceLogo}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-brand-50 file:text-brand-700
                    hover:file:bg-brand-100
                    disabled:opacity-50"
                />
              </label>
              <p className="mt-2 text-xs text-gray-500">
                PNG, JPEG, SVG oder WebP. Max. 500KB.
              </p>
            </div>
          </div>
        </section>

        {/* Weitere Assets */}
        <section className="bg-white rounded-xl border border-wheat-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Weitere Bilder</h2>
            <label className="inline-flex items-center px-4 py-2 bg-brand-500 text-white
                             rounded-lg hover:bg-brand-600 transition-colors font-medium cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4v16m8-8H4" />
              </svg>
              Hochladen
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Wird geladen...</div>
          ) : otherAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine weiteren Bilder vorhanden.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherAssets.map((asset) => (
                <div key={asset.id} className="border border-wheat-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    <img
                      src={asset.base64Data}
                      alt={asset.name}
                      className="w-24 h-24 object-contain flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(`{{${asset.id}}}`)}
                        className="mt-1 inline-flex items-center px-2 py-0.5 bg-brand-50 text-brand-700
                                   rounded font-mono text-xs hover:bg-brand-100 transition-colors"
                        title="Klicken zum Kopieren"
                      >
                        {`{{${asset.id}}}`}
                      </button>
                      {asset.htmlTag && (
                        <p className="mt-1 text-xs text-green-600">HTML-Tag definiert</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAsset(asset.id);
                            setEditHtmlTag(asset.htmlTag || `<img src="{{src}}" alt="${asset.name}" width="600" style="max-width:100%; display:block; border:0;" />`);
                          }}
                          className="text-xs text-brand-600 hover:text-brand-800"
                        >
                          HTML-Tag bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                  {editingAsset === asset.id && (
                    <div className="mt-3 border-t border-wheat-200 pt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        HTML-Tag (verwende <code className="bg-gray-100 px-1 rounded">{'{{src}}'}</code> für die Bild-URL)
                      </label>
                      <textarea
                        value={editHtmlTag}
                        onChange={(e) => setEditHtmlTag(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-wheat-300 rounded-lg text-xs font-mono
                                   focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateHtmlTag(asset.id, editHtmlTag)}
                          className="px-3 py-1 bg-brand-500 text-white rounded text-xs hover:bg-brand-600"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingAsset(null)}
                          className="px-3 py-1 border border-wheat-300 text-gray-700 rounded text-xs hover:bg-wheat-100"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-wheat-200 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bild hochladen</h3>

            {uploadPreview && (
              <div className="mb-4 border border-wheat-200 rounded-lg p-3 bg-gray-50">
                <img src={uploadPreview} alt="Vorschau" className="max-h-32 mx-auto" />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="z.B. EcoVadis Banner"
                  className="w-full px-3 py-2 border border-wheat-300 rounded-lg
                             focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platzhalter-ID
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-sm">{'{{'}</span>
                  <input
                    type="text"
                    value={uploadId}
                    onChange={(e) => setUploadId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="z.B. banner"
                    className="flex-1 px-3 py-2 border border-wheat-300 rounded-lg font-mono
                               focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <span className="text-gray-400 font-mono text-sm">{'}}'}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Kleinbuchstaben, Zahlen und Bindestriche. Leer = automatische ID.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTML-Tag <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={uploadHtmlTag}
                  onChange={(e) => setUploadHtmlTag(e.target.value)}
                  rows={3}
                  placeholder={`<img src="{{src}}" alt="Beschreibung" width="600" style="max-width:100%; display:block; border:0;" />`}
                  className="w-full px-3 py-2 border border-wheat-300 rounded-lg text-sm font-mono
                             focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Verwende <code className="bg-gray-100 px-1 rounded">{'{{src}}'}</code> als Platzhalter
                  für die Bild-URL. Wenn leer, wird nur die Bild-URL eingefügt.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowUploadDialog(false); setUploadFile(null); setUploadPreview(''); }}
                className="flex-1 px-4 py-2 border border-wheat-300 text-gray-700 rounded-lg
                           hover:bg-wheat-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg
                           hover:bg-brand-600 transition-colors font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
