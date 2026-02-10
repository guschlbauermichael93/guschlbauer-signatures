import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Dashboard-Statistiken aus der Datenbank
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const db = getDb();

    const templateCount = (db.prepare(
      'SELECT COUNT(*) as count FROM templates WHERE is_active = 1'
    ).get() as { count: number }).count;

    const assetCount = (db.prepare(
      'SELECT COUNT(*) as count FROM assets'
    ).get() as { count: number }).count;

    const userCount = (db.prepare(
      'SELECT COUNT(*) as count FROM user_templates'
    ).get() as { count: number }).count;

    return NextResponse.json({
      templates: templateCount,
      assets: assetCount,
      users: userCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
