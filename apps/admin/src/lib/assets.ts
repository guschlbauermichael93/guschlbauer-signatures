import { SignatureAsset } from '@guschlbauer/shared';
import { getDb, logAudit } from './db';

/**
 * Assets Data Layer (Logos, Bilder)
 */

interface DbAsset {
  id: string;
  name: string;
  mime_type: string;
  base64_data: string;
  width: number | null;
  height: number | null;
  html_tag: string | null;
  created_at: string;
}

function mapDbToAsset(row: DbAsset): SignatureAsset & { htmlTag?: string } {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    base64Data: row.base64_data,
    width: row.width || undefined,
    height: row.height || undefined,
    htmlTag: row.html_tag || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getAllAssets(): Promise<SignatureAsset[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() as DbAsset[];
  return rows.map(mapDbToAsset);
}

export async function getAssetById(id: string): Promise<SignatureAsset | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as DbAsset | undefined;
  return row ? mapDbToAsset(row) : null;
}

export async function getAssetBase64(id: string): Promise<string | null> {
  const db = getDb();
  const row = db.prepare('SELECT base64_data, mime_type FROM assets WHERE id = ?').get(id) as 
    { base64_data: string; mime_type: string } | undefined;
  
  if (!row) return null;
  
  // Return as data URL
  if (row.base64_data.startsWith('data:')) {
    return row.base64_data;
  }
  return `data:${row.mime_type};base64,${row.base64_data}`;
}

export async function createAsset(
  name: string,
  mimeType: string,
  base64Data: string,
  width?: number,
  height?: number,
  userEmail?: string,
  customId?: string,
  htmlTag?: string
): Promise<SignatureAsset> {
  const db = getDb();
  const id = customId || `asset-${Date.now()}`;

  db.prepare(`
    INSERT INTO assets (id, name, mime_type, base64_data, width, height, html_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, mimeType, base64Data, width || null, height || null, htmlTag || null);

  logAudit('create', 'asset', id, userEmail, { name, mimeType });

  return (await getAssetById(id))!;
}

export async function updateAssetMeta(
  id: string,
  updates: { name?: string; htmlTag?: string },
  userEmail?: string
): Promise<SignatureAsset | null> {
  const db = getDb();
  const existing = await getAssetById(id);
  if (!existing) return null;

  if (updates.name !== undefined) {
    db.prepare('UPDATE assets SET name = ? WHERE id = ?').run(updates.name, id);
  }
  if (updates.htmlTag !== undefined) {
    db.prepare('UPDATE assets SET html_tag = ? WHERE id = ?').run(updates.htmlTag || null, id);
  }

  logAudit('update', 'asset', id, userEmail, updates);
  return getAssetById(id);
}

export async function updateAsset(
  id: string,
  base64Data: string,
  mimeType?: string,
  userEmail?: string
): Promise<SignatureAsset | null> {
  const db = getDb();
  const existing = await getAssetById(id);
  if (!existing) return null;

  if (mimeType) {
    db.prepare('UPDATE assets SET base64_data = ?, mime_type = ? WHERE id = ?').run(base64Data, mimeType, id);
  } else {
    db.prepare('UPDATE assets SET base64_data = ? WHERE id = ?').run(base64Data, id);
  }

  logAudit('update', 'asset', id, userEmail);

  return getAssetById(id);
}

export async function deleteAsset(id: string, userEmail?: string): Promise<boolean> {
  if (id === 'logo') {
    throw new Error('Cannot delete primary logo');
  }

  const db = getDb();
  const result = db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  
  if (result.changes > 0) {
    logAudit('delete', 'asset', id, userEmail);
    return true;
  }
  return false;
}

// Validation Helpers
export function isValidImageType(mimeType: string): boolean {
  return ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'].includes(mimeType);
}

export function isValidImageSize(sizeInBytes: number, maxSizeKB: number = 500): boolean {
  return sizeInBytes <= maxSizeKB * 1024;
}
