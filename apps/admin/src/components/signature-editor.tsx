'use client';

interface SignatureEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SignatureEditor({ value, onChange }: SignatureEditorProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 px-4 py-3 border border-wheat-300 rounded-lg 
                   font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-brand-500 
                   focus:border-brand-500 resize-none template-editor"
        spellCheck={false}
      />
      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
        {value.length} Zeichen
      </div>
    </div>
  );
}
