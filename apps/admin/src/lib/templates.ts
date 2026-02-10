import { SignatureTemplate, SignatureTemplateCreateInput, SignatureTemplateUpdateInput } from '@guschlbauer/shared';
import { getDb, logAudit } from './db';

/**
 * Templates Data Layer
 */

interface DbTemplate {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

function mapDbToTemplate(row: DbTemplate): SignatureTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    htmlContent: row.html_content,
    isDefault: row.is_default === 1,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by || 'unknown',
  };
}

export async function getAllTemplates(): Promise<SignatureTemplate[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM templates 
    WHERE is_active = 1 
    ORDER BY is_default DESC, name ASC
  `).all() as DbTemplate[];
  
  return rows.map(mapDbToTemplate);
}

export async function getTemplateById(id: string): Promise<SignatureTemplate | null> {
  const db = getDb();
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as DbTemplate | undefined;
  return row ? mapDbToTemplate(row) : null;
}

export async function getDefaultTemplate(): Promise<SignatureTemplate | null> {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM templates 
    WHERE is_active = 1 
    ORDER BY is_default DESC 
    LIMIT 1
  `).get() as DbTemplate | undefined;
  
  return row ? mapDbToTemplate(row) : null;
}

export async function createTemplate(
  input: SignatureTemplateCreateInput,
  userEmail?: string
): Promise<SignatureTemplate> {
  const db = getDb();
  const id = `template-${Date.now()}`;
  
  if (input.isDefault) {
    db.prepare('UPDATE templates SET is_default = 0').run();
  }

  db.prepare(`
    INSERT INTO templates (id, name, description, html_content, is_default, is_active, created_by, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
  `).run(
    id,
    input.name,
    input.description || null,
    input.htmlContent,
    input.isDefault ? 1 : 0,
    userEmail || null
  );

  logAudit('create', 'template', id, userEmail, { name: input.name });

  return (await getTemplateById(id))!;
}

export async function updateTemplate(
  id: string,
  input: SignatureTemplateUpdateInput,
  userEmail?: string
): Promise<SignatureTemplate | null> {
  const db = getDb();
  const existing = await getTemplateById(id);
  if (!existing) return null;

  if (input.isDefault) {
    db.prepare('UPDATE templates SET is_default = 0').run();
  }

  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description || null);
  }
  if (input.htmlContent !== undefined) {
    updates.push('html_content = ?');
    values.push(input.htmlContent);
  }
  if (input.isDefault !== undefined) {
    updates.push('is_default = ?');
    values.push(input.isDefault ? 1 : 0);
  }
  if (input.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(input.isActive ? 1 : 0);
  }

  values.push(id);

  db.prepare(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  logAudit('update', 'template', id, userEmail, input as unknown as Record<string, unknown>);

  return getTemplateById(id);
}

export async function deleteTemplate(id: string, userEmail?: string): Promise<boolean> {
  const db = getDb();
  const existing = await getTemplateById(id);
  
  if (!existing) return false;
  if (existing.isDefault) throw new Error('Cannot delete default template');

  db.prepare('UPDATE templates SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  logAudit('delete', 'template', id, userEmail);

  return true;
}

export async function getTemplateForUser(userEmail: string): Promise<SignatureTemplate | null> {
  const db = getDb();
  
  const userTemplate = db.prepare(`
    SELECT t.* FROM templates t
    JOIN user_templates ut ON t.id = ut.template_id
    WHERE ut.user_email = ? AND t.is_active = 1
  `).get(userEmail) as DbTemplate | undefined;
  
  if (userTemplate) return mapDbToTemplate(userTemplate);
  
  return getDefaultTemplate();
}

export async function assignTemplateToUser(
  userEmail: string,
  templateId: string,
  assignedBy?: string
): Promise<void> {
  const db = getDb();
  
  db.prepare(`
    INSERT OR REPLACE INTO user_templates (user_email, template_id, created_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(userEmail, templateId);
  
  logAudit('assign', 'user_template', userEmail, assignedBy, { templateId });
}
