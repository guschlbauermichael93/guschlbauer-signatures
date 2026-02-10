import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  updateAssetMeta,
  deleteAsset,
  isValidImageType,
  isValidImageSize
} from '@/lib/assets';
import { validateRequest } from '@/lib/auth';

/**
 * GET /api/assets
 * Liste aller Assets
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const assets = await getAllAssets();
    return NextResponse.json({ items: assets, total: assets.length });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

/**
 * POST /api/assets
 * Neues Asset hochladen (Logo etc.)
 * 
 * Erwartet multipart/form-data mit:
 * - file: Die Bilddatei
 * - name: Name des Assets
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string || 'Uploaded Image';
    const customId = formData.get('customId') as string || '';
    const htmlTag = formData.get('htmlTag') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Custom ID validieren (nur Kleinbuchstaben, Zahlen, Bindestriche)
    if (customId && !/^[a-z0-9-]+$/.test(customId)) {
      return NextResponse.json({
        error: 'Platzhalter-ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'
      }, { status: 400 });
    }

    // Prüfen ob Custom ID schon existiert
    if (customId) {
      const existing = await getAssetById(customId);
      if (existing) {
        return NextResponse.json({
          error: `Platzhalter-ID "${customId}" ist bereits vergeben`
        }, { status: 400 });
      }
    }

    // Validierung
    if (!isValidImageType(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: PNG, JPEG, GIF, SVG, WebP'
      }, { status: 400 });
    }

    if (!isValidImageSize(file.size)) {
      return NextResponse.json({
        error: 'File too large. Maximum 500KB'
      }, { status: 400 });
    }

    // File zu Base64 konvertieren
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const base64Data = `data:${file.type};base64,${base64}`;

    // Asset speichern
    const asset = await createAsset(
      name,
      file.type,
      base64Data,
      undefined, // width
      undefined, // height
      auth.userEmail,
      customId || undefined,
      htmlTag || undefined
    );

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json({ error: 'Failed to upload asset' }, { status: 500 });
  }
}

/**
 * PUT /api/assets
 * Asset aktualisieren (z.B. Logo ersetzen)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File | null;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!isValidImageType(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (!isValidImageSize(file.size)) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const base64Data = `data:${file.type};base64,${base64}`;

    const asset = await updateAsset(id, base64Data, file.type, auth.userEmail);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // HTML-Tag auch aktualisieren falls mitgesendet
    const htmlTag = formData.get('htmlTag') as string | null;
    if (htmlTag !== null) {
      await updateAssetMeta(id, { htmlTag }, auth.userEmail);
      return NextResponse.json(await getAssetById(id));
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

/**
 * PATCH /api/assets
 * Asset-Metadaten aktualisieren (Name, HTML-Tag)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, htmlTag } = body;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const asset = await updateAssetMeta(id, { name, htmlTag }, auth.userEmail);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset meta:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

/**
 * DELETE /api/assets
 * Asset löschen
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    await deleteAsset(id, auth.userEmail);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('primary')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
