import { Header } from '@/components/header';
import { TemplateList } from '@/components/template-list';

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-wheat-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Signatur-Vorlagen</h1>
          <p className="mt-2 text-gray-600">
            Erstellen und verwalten Sie Ihre E-Mail-Signatur-Vorlagen.
          </p>
        </div>

        <div className="flex items-center justify-end mb-6">
          <a
            href="/templates/new"
            className="inline-flex items-center px-4 py-2 bg-brand-500 text-white
                       rounded-lg hover:bg-brand-600 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Neue Vorlage
          </a>
        </div>

        <TemplateList />
      </main>
    </div>
  );
}
