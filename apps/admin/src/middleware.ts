import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Erlaubte Origins für CORS.
 * Aus ALLOWED_ORIGINS Env-Variable (kommagetrennt) oder Defaults.
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }
  // Defaults für Entwicklung
  if (process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true') {
    return [
      'https://localhost:3100',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ];
  }
  return [];
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

function setCorsHeaders(response: NextResponse, origin: string | null): void {
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : '';
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email');
    response.headers.set('Vary', 'Origin');
  }
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Rate-Limiting für API-Routen
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const res = new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
    res.headers.set('Retry-After', String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)));
    setCorsHeaders(res, origin);
    return res;
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 200 });
    setCorsHeaders(res, origin);
    return res;
  }

  const response = NextResponse.next();
  setCorsHeaders(response, origin);

  // Rate-Limit Headers
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
