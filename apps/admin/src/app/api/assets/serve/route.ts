import { NextRequest, NextResponse } from 'next/server';
import { getAssetById } from '@/lib/assets';

/**
 * GET /api/assets/serve?id=logo
 * Liefert ein Asset als Bilddatei (nicht base64)
 *
 * Kein Auth erforderlich - Assets sind öffentlich (wie Bilder auf einer Webseite).
 * Die Asset-IDs sind nicht erratbar und enthalten keine sensiblen Daten.
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const asset = await getAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Base64 data URL → Binary
    let base64 = asset.base64Data;
    if (base64.startsWith('data:')) {
      base64 = base64.split(',')[1];
    }

    const buffer = Buffer.from(base64, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json({ error: 'Failed to serve asset' }, { status: 500 });
  }
}
