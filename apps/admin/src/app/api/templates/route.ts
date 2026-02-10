import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '@/lib/templates';
import { validateRequest } from '@/lib/auth';

/**
 * GET /api/templates
 * Liste aller Templates, oder einzelnes Template per ?id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // GET ist öffentlich (Add-In braucht Template-Liste, enthält keine sensiblen Daten)
    // POST/PUT/DELETE bleiben auth-geschützt
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const template = await getTemplateById(id);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(template);
    }

    const templates = await getAllTemplates();
    return NextResponse.json({ items: templates, total: templates.length });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Neues Template erstellen
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.name || !body.htmlContent) {
      return NextResponse.json({ error: 'Name and htmlContent required' }, { status: 400 });
    }

    const template = await createTemplate(body, auth.userEmail);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

/**
 * PUT /api/templates
 * Template aktualisieren (ID im Body)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await validateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const template = await updateTemplate(body.id, body, auth.userEmail);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

/**
 * DELETE /api/templates
 * Template löschen (ID als Query-Parameter)
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
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    await deleteTemplate(id, auth.userEmail);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('default')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
