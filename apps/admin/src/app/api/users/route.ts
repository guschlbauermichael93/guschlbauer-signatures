import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUser, isAzureADConfigured } from '@/lib/graph-client';
import { MOCK_USERS, getMockUser } from '@/lib/mock-data';
import { validateRequest } from '@/lib/auth';
import { getTemplateForUser, assignTemplateToUser } from '@/lib/templates';

const DEV_MODE = process.env.DEV_MODE === 'true';

/**
 * GET /api/users
 * Liste aller User aus Azure AD (oder Mock-Daten)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    let users;

    if (DEV_MODE || !isAzureADConfigured()) {
      users = MOCK_USERS;
    } else {
      users = await getAllUsers();
    }

    // Template-Zuweisungen hinzufügen
    const usersWithTemplates = await Promise.all(
      users.map(async (user) => {
        const template = await getTemplateForUser(user.mail);
        return {
          ...user,
          assignedTemplateId: template?.id || 'default',
          assignedTemplateName: template?.name || 'Standard',
        };
      })
    );

    return NextResponse.json({ 
      items: usersWithTemplates, 
      total: usersWithTemplates.length,
      source: (DEV_MODE || !isAzureADConfigured()) ? 'mock' : 'azure-ad'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Template einem User zuweisen
 * 
 * Body: { email: string, templateId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { email, templateId } = await request.json();

    if (!email || !templateId) {
      return NextResponse.json({ error: 'Email and templateId required' }, { status: 400 });
    }

    await assignTemplateToUser(email, templateId, auth.userEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning template:', error);
    return NextResponse.json({ error: 'Failed to assign template' }, { status: 500 });
  }
}
