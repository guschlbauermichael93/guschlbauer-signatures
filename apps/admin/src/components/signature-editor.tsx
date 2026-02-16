'use client';

import { useState } from 'react';

interface SignatureEditorProps {
  value: string;
  onChange: (value: string) => void;
  replyValue?: string;
  onReplyChange?: (value: string) => void;
}

export function SignatureEditor({ value, onChange, replyValue, onReplyChange }: SignatureEditorProps) {
  const hasReplyTab = replyValue !== undefined && onReplyChange !== undefined;
  const [activeTab, setActiveTab] = useState<'full' | 'reply'>('full');

  const currentValue = activeTab === 'reply' ? (replyValue || '') : value;
  const currentOnChange = activeTab === 'reply' ? onReplyChange! : onChange;

  return (
    <div className="relative">
      {/* Tabs */}
      {hasReplyTab && (
        <div className="flex border-b border-wheat-300 mb-3">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'full'
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vollständige Signatur
          </button>
          <button
            onClick={() => setActiveTab('reply')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reply'
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Antwort-Signatur
          </button>
        </div>
      )}

      <textarea
        value={currentValue}
        onChange={(e) => currentOnChange(e.target.value)}
        className="w-full h-96 px-4 py-3 border border-wheat-300 rounded-lg
                   font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-brand-500
                   focus:border-brand-500 resize-none template-editor"
        spellCheck={false}
      />
      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
        {currentValue.length} Zeichen
      </div>

      {/* Hint für Antwort-Signatur */}
      {hasReplyTab && activeTab === 'reply' && (
        <p className="mt-2 text-xs text-gray-500">
          Kurze Signatur für Antworten, wenn die vollständige Signatur bereits im E-Mail-Verlauf enthalten ist.
        </p>
      )}
    </div>
  );
}
