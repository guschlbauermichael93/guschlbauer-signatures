'use client';

import { useMemo } from 'react';
import { renderTemplate, AzureADUser } from '@guschlbauer/shared';

// Demo-User für die Vorschau
const DEMO_USER: AzureADUser = {
  id: 'demo',
  displayName: 'Max Mustermann',
  givenName: 'Max',
  surname: 'Mustermann',
  mail: 'max.mustermann@guschlbauer.at',
  jobTitle: 'Produktionsleiter',
  department: 'Produktion',
  mobilePhone: '+43 664 123 4567',
  businessPhones: ['+43 7242 51234-10'],
  officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
  companyName: 'Guschlbauer Backwaren GmbH',
};

// Placeholder Logo (Base64 encoded simple orange square)
const DEMO_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTIwIDYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiNlZDc1MWQiIHJ4PSI4Ii8+PHRleHQgeD0iNjAiIHk9IjM4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCI+R3VzY2hsYmF1ZXI8L3RleHQ+PC9zdmc+';

interface SignaturePreviewProps {
  htmlContent: string;
  user?: AzureADUser;
}

export function SignaturePreview({ htmlContent, user = DEMO_USER }: SignaturePreviewProps) {
  const renderedHtml = useMemo(() => {
    let html = renderTemplate(htmlContent, user);
    // Logo-Platzhalter ersetzen
    html = html.replace(/\{\{logo\}\}/g, DEMO_LOGO);
    return html;
  }, [htmlContent, user]);

  return (
    <div className="space-y-4">
      {/* Mail Preview Container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Fake Mail Header */}
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Von:</span>
            <span className="text-gray-900">{user.displayName} &lt;{user.mail}&gt;</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="text-gray-500">An:</span>
            <span className="text-gray-700">empfaenger@beispiel.at</span>
          </div>
          <div className="flex items-center gap-3 text-sm mt-1">
            <span className="text-gray-500">Betreff:</span>
            <span className="text-gray-900">Beispiel-Email</span>
          </div>
        </div>

        {/* Mail Body */}
        <div className="p-4 bg-white">
          <p className="text-gray-700 mb-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
            Sehr geehrte Damen und Herren,
            <br /><br />
            vielen Dank für Ihre Anfrage. Gerne sende ich Ihnen die gewünschten Informationen zu.
            <br /><br />
            Mit freundlichen Grüßen
          </p>

          {/* Signature */}
          <div 
            className="signature-preview mt-4 pt-4 border-t border-gray-100"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>

      {/* Device Selector */}
      <div className="flex items-center justify-center gap-2">
        <button className="px-3 py-1.5 text-sm bg-brand-100 text-brand-700 rounded-lg font-medium">
          Desktop
        </button>
        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-wheat-100 rounded-lg">
          Mobile
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Die Vorschau zeigt, wie die Signatur in Outlook erscheint
      </p>
    </div>
  );
}
