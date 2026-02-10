import { NextRequest, NextResponse } from 'next/server';
import { renderTemplate, htmlToPlainText, AzureADUser } from '@guschlbauer/shared';
import { getTemplateById, getTemplateForUser, getDefaultTemplate } from '@/lib/templates';
import { getAssetBase64, getAllAssets } from '@/lib/assets';
import { getUser, isAzureADConfigured } from '@/lib/graph-client';
import { getMockUser, createMockUserFromEmail } from '@/lib/mock-data';
import { validateRequest } from '@/lib/auth';

const DEV_MODE = process.env.DEV_MODE === 'true';

/**
 * GET /api/signature
 * Generiert eine personalisierte Signatur
 * 
 * Query-Parameter:
 * - email: E-Mail des Users (required)
 * - templateId: Optional, nutzt Default wenn nicht angegeben
 * 
 * Auth: Bearer Token (Azure AD SSO) oder Dev Mode
 */
export async function GET(request: NextRequest) {
  try {
    // Auth Check: Bearer Token (Admin-UI / Add-In SSO)
    if (!DEV_MODE) {
      const auth = await validateRequest(request);
      if (!auth.authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const templateId = searchParams.get('templateId');
    const embedMode = searchParams.get('embed') || 'inline'; // 'inline' (base64), 'url', oder 'cid'

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

    // Alle Assets einbetten (logo, banner, etc.)
    let htmlContent = template.htmlContent;
    const assets = await getAllAssets();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const usedAssets: Array<{ id: string; filename: string; mimeType: string; base64: string }> = [];

    for (const asset of assets) {
      const pattern = new RegExp(`\\{\\{${asset.id}\\}\\}`, 'g');
      if (!pattern.test(htmlContent)) continue; // Asset wird nicht verwendet

      let src: string;
      if (embedMode === 'cid') {
        const ext = asset.mimeType.split('/')[1] || 'png';
        const filename = `${asset.id}.${ext}`;
        src = `cid:${filename}`;
        // Base64 ohne data: Prefix für Attachments
        let rawBase64 = asset.base64Data;
        if (rawBase64.startsWith('data:')) {
          rawBase64 = rawBase64.split(',')[1];
        }
        usedAssets.push({ id: asset.id, filename, mimeType: asset.mimeType, base64: rawBase64 });
      } else if (embedMode === 'url') {
        src = `${baseUrl}/api/assets/serve?id=${asset.id}`;
      } else {
        src = asset.base64Data.startsWith('data:')
          ? asset.base64Data
          : `data:${asset.mimeType};base64,${asset.base64Data}`;
      }

      // Reset regex lastIndex
      const replacePattern = new RegExp(`\\{\\{${asset.id}\\}\\}`, 'g');
      const assetWithMeta = asset as typeof asset & { htmlTag?: string };
      if (assetWithMeta.htmlTag) {
        const fullTag = assetWithMeta.htmlTag.replace(/\{\{src\}\}/g, src);
        htmlContent = htmlContent.replace(replacePattern, fullTag);
      } else {
        htmlContent = htmlContent.replace(replacePattern, src);
      }
    }

    // Template rendern
    const renderedHtml = renderTemplate(htmlContent, user);
    const plainText = htmlToPlainText(renderedHtml);

    const response: Record<string, unknown> = {
      html: renderedHtml,
      plainText,
      templateId: template.id,
      userId: user.id,
      generatedAt: new Date().toISOString(),
    };

    // Bei CID-Modus: Assets mitliefern für Inline-Attachments
    if (embedMode === 'cid') {
      response.attachments = usedAssets;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}
