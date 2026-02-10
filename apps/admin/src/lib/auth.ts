import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Auth Middleware
 * 
 * Schützt API-Routen vor unautorisierten Zugriffen.
 * 
 * Unterstützt:
 * 1. Azure AD Bearer Tokens (für Admin-UI)
 * 2. API Secret (für Outlook Add-In)
 * 3. Dev Mode (bypassed Auth für lokale Entwicklung)
 */

const DEV_MODE = process.env.DEV_MODE === 'true';
const API_SECRET = process.env.API_SECRET;
const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID;

interface AuthResult {
  authenticated: boolean;
  userEmail?: string;
  error?: string;
}

/**
 * Validiert einen Request
 */
export async function validateRequest(request: NextRequest): Promise<AuthResult> {
  // Dev Mode: Alles erlauben
  if (DEV_MODE) {
    return { authenticated: true, userEmail: 'dev@localhost' };
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { authenticated: false, error: 'No authorization header' };
  }

  // API Secret Check (für Add-In)
  if (authHeader.startsWith('ApiKey ')) {
    const apiKey = authHeader.replace('ApiKey ', '');
    if (apiKey === API_SECRET) {
      // Email aus Query oder Header holen
      const email = request.nextUrl.searchParams.get('email') || 
                    request.headers.get('x-user-email') ||
                    'addin@internal';
      return { authenticated: true, userEmail: email };
    }
    return { authenticated: false, error: 'Invalid API key' };
  }

  // Bearer Token Check (für Admin-UI)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    return validateAzureADToken(token);
  }

  return { authenticated: false, error: 'Invalid authorization format' };
}

/**
 * Validiert Azure AD JWT Token
 */
async function validateAzureADToken(token: string): Promise<AuthResult> {
  try {
    if (!AZURE_AD_TENANT_ID) {
      return { authenticated: false, error: 'Azure AD not configured' };
    }

    // JWKS URI für Azure AD
    const jwksUri = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/discovery/v2.0/keys`;
    
    // In Produktion: JWKS cachen
    const response = await fetch(jwksUri);
    const jwks = await response.json();

    // Token verifizieren (vereinfacht - in Produktion jose/jwks verwenden)
    const { payload } = await jwtVerify(
      token,
      async (header) => {
        const key = jwks.keys.find((k: { kid: string }) => k.kid === header.kid);
        if (!key) throw new Error('Key not found');
        return await importJWK(key);
      },
      {
        issuer: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`,
      }
    );

    return {
      authenticated: true,
      userEmail: payload.preferred_username as string || payload.email as string,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { authenticated: false, error: 'Invalid token' };
  }
}

// Helper für JWK Import
async function importJWK(jwk: Record<string, unknown>) {
  const { importJWK: jose_importJWK } = await import('jose');
  return jose_importJWK(jwk as unknown as import('jose').JWK, 'RS256');
}

/**
 * Middleware-Wrapper für API-Routen
 */
export function withAuth(
  handler: (request: NextRequest, context: { userEmail: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const auth = await validateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, { userEmail: auth.userEmail! });
  };
}

/**
 * Öffentliche Routen (kein Auth erforderlich)
 * z.B. Health Check
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/api/health',
    '/api/signature', // Add-In nutzt API Key
  ];
  return publicRoutes.some(route => pathname.startsWith(route));
}
