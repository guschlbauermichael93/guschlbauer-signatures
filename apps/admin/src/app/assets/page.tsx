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
  createdAt: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const res = await authFetch('/api/assets', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await loadAssets();
      } else {
        const error = await res.json();
        alert(error.error || 'Upload fehlgeschlagen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                onChange={handleUpload}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherAssets.map((asset) => (
                <div key={asset.id} className="border border-wheat-200 rounded-lg p-3">
                  <img 
                    src={asset.base64Data} 
                    alt={asset.name}
                    className="w-full h-24 object-contain mb-2"
                  />
                  <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.mimeType}</p>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
