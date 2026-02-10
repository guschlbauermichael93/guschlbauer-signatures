import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health Check Endpoint (öffentlich)
 * Gibt nur unkritische Informationen zurück.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
}
