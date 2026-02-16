import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * SQLite Database Layer
 * Verwendet better-sqlite3 für synchrone, schnelle Operationen
 */

// Datenbank-Pfad
const getDbPath = () => {
  const envPath = process.env.DATABASE_URL?.replace('file:', '');
  if (envPath) return envPath;
  
  // Lokal: Im Projekt-Root
  const localPath = path.join(process.cwd(), 'data', 'signatures.db');
  return localPath;
};

// Singleton
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    
    // Verzeichnis erstellen
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    initializeSchema(db);
    console.log('Database initialized:', dbPath);
  }
  return db;
}

function initializeSchema(database: Database.Database) {
  // Templates
  database.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      html_content TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT
    )
  `);

  // Assets
  database.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      base64_data TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      html_tag TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: html_tag Spalte hinzufügen falls nicht vorhanden
  try {
    database.exec(`ALTER TABLE assets ADD COLUMN html_tag TEXT`);
  } catch {
    // Spalte existiert bereits
  }

  // Migration: html_content_reply Spalte hinzufügen falls nicht vorhanden
  try {
    database.exec(`ALTER TABLE templates ADD COLUMN html_content_reply TEXT`);
  } catch {
    // Spalte existiert bereits
  }

  // Migration: Default Reply-Template für bestehende Templates setzen
  database.prepare(`
    UPDATE templates SET html_content_reply = ?
    WHERE html_content_reply IS NULL AND id = 'default'
  `).run(DEFAULT_REPLY_TEMPLATE_HTML);

  // User-Template Zuweisungen
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_templates (
      user_email TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )
  `);

  // Audit Log
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_email TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Default Data
  seedDefaultData(database);
}

function seedDefaultData(database: Database.Database) {
  // Check if default template exists
  const existing = database.prepare('SELECT id FROM templates WHERE id = ?').get('default');
  if (existing) return;

  // Default Template
  database.prepare(`
    INSERT INTO templates (id, name, description, html_content, html_content_reply, is_default, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, 1, 1, 'system')
  `).run(
    'default',
    'Standard Signatur',
    'Offizielle Guschlbauer-Signatur mit Logo',
    DEFAULT_TEMPLATE_HTML,
    DEFAULT_REPLY_TEMPLATE_HTML
  );

  // Default Logo
  database.prepare(`
    INSERT INTO assets (id, name, mime_type, base64_data, width, height)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('logo', 'Guschlbauer Logo', 'image/svg+xml', PLACEHOLDER_LOGO, 120, 60);
}

// Audit Helper
export function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  userEmail?: string,
  details?: Record<string, unknown>
) {
  try {
    const database = getDb();
    database.prepare(`
      INSERT INTO audit_log (action, entity_type, entity_id, user_email, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(action, entityType, entityId, userEmail || null, details ? JSON.stringify(details) : null);
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// Default Template
const DEFAULT_TEMPLATE_HTML = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid #ed751d; vertical-align: top;">
      <img src="{{logo}}" alt="Guschlbauer" width="120" style="display: block;" />
    </td>
    <td style="padding-left: 15px; vertical-align: top;">
      <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 16px; color: #1a1a1a;">
        {{displayName}}
      </p>
      <p style="margin: 0 0 10px 0; color: #ed751d; font-size: 13px;">
        {{jobTitle}}
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6;">
        <strong>Guschlbauer Backwaren GmbH</strong><br />
        {{officeLocation}}<br />
        Tel: {{businessPhones}}<br />
        Mobil: {{mobilePhone}}<br />
        E-Mail: {{mail}}
      </p>
      <p style="margin: 15px 0 0 0; font-size: 11px; color: #888888;">
        Seit 1919 - Tradition trifft Qualität
      </p>
    </td>
  </tr>
</table>`;

const DEFAULT_REPLY_TEMPLATE_HTML = `<p style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; margin: 0;">
  Freundliche Gr&uuml;&szlig;e<br />
  <strong>{{displayName}}</strong>
</p>`;

const PLACEHOLDER_LOGO ='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTIwIDYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiNlZDc1MWQiIHJ4PSI4Ii8+PHRleHQgeD0iNjAiIHk9IjM4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCI+R3VzY2hsYmF1ZXI8L3RleHQ+PC9zdmc+';
