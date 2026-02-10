// ============================================
// User Types (aus Azure AD / Microsoft Graph)
// ============================================

export interface AzureADUser {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  officeLocation?: string;
  companyName?: string;
}

// ============================================
// Signatur Template Types
// ============================================

export interface SignatureTemplate {
  id: string;
  name: string;
  description?: string;
  htmlContent: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SignatureTemplateCreateInput {
  name: string;
  description?: string;
  htmlContent: string;
  isDefault?: boolean;
}

export interface SignatureTemplateUpdateInput {
  name?: string;
  description?: string;
  htmlContent?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// ============================================
// Asset Types (Logos, Bilder)
// ============================================

export interface SignatureAsset {
  id: string;
  name: string;
  mimeType: string;
  base64Data: string; // Für inline embedding
  url?: string; // Falls extern gehostet
  width?: number;
  height?: number;
  createdAt: Date;
}

// ============================================
// Rendered Signature
// ============================================

export interface RenderedSignature {
  html: string;
  plainText: string;
  generatedAt: Date;
  templateId: string;
  userId: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Platzhalter für Templates
// ============================================

export const TEMPLATE_PLACEHOLDERS = {
  displayName: '{{displayName}}',
  givenName: '{{givenName}}',
  surname: '{{surname}}',
  mail: '{{mail}}',
  jobTitle: '{{jobTitle}}',
  department: '{{department}}',
  mobilePhone: '{{mobilePhone}}',
  businessPhones: '{{businessPhones}}',
  officeLocation: '{{officeLocation}}',
  companyName: '{{companyName}}',
} as const;

export type PlaceholderKey = keyof typeof TEMPLATE_PLACEHOLDERS;

// ============================================
// Utility Functions
// ============================================

/**
 * Ersetzt Platzhalter im Template mit User-Daten
 */
export function renderTemplate(
  template: string,
  user: AzureADUser
): string {
  let result = template;
  
  result = result.replace(/\{\{displayName\}\}/g, user.displayName || '');
  result = result.replace(/\{\{givenName\}\}/g, user.givenName || '');
  result = result.replace(/\{\{surname\}\}/g, user.surname || '');
  result = result.replace(/\{\{mail\}\}/g, user.mail || '');
  result = result.replace(/\{\{jobTitle\}\}/g, user.jobTitle || '');
  result = result.replace(/\{\{department\}\}/g, user.department || '');
  result = result.replace(/\{\{mobilePhone\}\}/g, user.mobilePhone || '');
  result = result.replace(/\{\{businessPhones\}\}/g, user.businessPhones?.[0] || '');
  result = result.replace(/\{\{officeLocation\}\}/g, user.officeLocation || '');
  result = result.replace(/\{\{companyName\}\}/g, user.companyName || 'Guschlbauer Backwaren GmbH');
  
  // Leere Zeilen entfernen, die durch fehlende Daten entstehen
  result = result.replace(/^\s*[\r\n]/gm, '');
  
  return result;
}

/**
 * Konvertiert HTML zu Plain Text für Fallback
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
