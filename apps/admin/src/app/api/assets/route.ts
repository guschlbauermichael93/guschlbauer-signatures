import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
      undefined, // width - könnte mit sharp extrahiert werden
      undefined, // height
      auth.userEmail
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

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
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
