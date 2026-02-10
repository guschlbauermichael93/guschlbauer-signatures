import { NextRequest, NextResponse } from 'next/server';
import { renderTemplate, htmlToPlainText, AzureADUser } from '@guschlbauer/shared';
import { getTemplateById, getTemplateForUser, getDefaultTemplate } from '@/lib/templates';
import { getAssetBase64 } from '@/lib/assets';
import { getUser, isAzureADConfigured } from '@/lib/graph-client';
import { getMockUser, createMockUserFromEmail } from '@/lib/mock-data';
import { validateRequest } from '@/lib/auth';

const DEV_MODE = process.env.DEV_MODE === 'true';
const API_SECRET = process.env.API_SECRET;

/**
 * GET /api/signature
 * Generiert eine personalisierte Signatur
 * 
 * Query-Parameter:
 * - email: E-Mail des Users (required)
 * - templateId: Optional, nutzt Default wenn nicht angegeben
 * 
 * Auth: API Key Header oder Dev Mode
 */
export async function GET(request: NextRequest) {
  try {
    // Auth Check: ApiKey (Add-In) oder Bearer Token (Admin-UI)
    if (!DEV_MODE) {
      const auth = await validateRequest(request);
      if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const templateId = searchParams.get('templateId');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // User-Daten holen
    let user: AzureADUser;
    
    if (DEV_MODE || !isAzureADConfigured()) {
      // Mock-Daten verwenden
      user = getMockUser(email) || createMockUserFromEmail(email);
    } else {
      try {
        user = await getUser(email);
      } catch (error) {
        console.error('Graph API error:', error);
        user = createMockUserFromEmail(email);
      }
    }

    // Template holen
    let template;
    if (templateId) {
      // Spezifisches Template angefordert
      template = await getTemplateById(templateId);
    } else {
      // User-spezifisches Template oder Default
      template = await getTemplateForUser(email);
    }

    if (!template) {
      return NextResponse.json({ error: 'No template found' }, { status: 404 });
    }

    // Logo einbetten
    let htmlContent = template.htmlContent;
    const logoBase64 = await getAssetBase64('logo');
    if (logoBase64) {
      htmlContent = htmlContent.replace(/\{\{logo\}\}/g, logoBase64);
    }

    // Template rendern
    const renderedHtml = renderTemplate(htmlContent, user);
    const plainText = htmlToPlainText(renderedHtml);

    return NextResponse.json({
      html: renderedHtml,
      plainText,
      templateId: template.id,
      userId: user.id,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}
