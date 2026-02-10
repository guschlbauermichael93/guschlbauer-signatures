import { Header } from '@/components/header';
import { TemplateList } from '@/components/template-list';
import { QuickStats } from '@/components/quick-stats';

export default function Home() {
  return (
    <div className="min-h-screen bg-wheat-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Signatur Manager
          </h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie zentral alle E-Mail-Signaturen für Ihre Mitarbeiter.
          </p>
        </div>

        {/* Stats Overview */}
        <QuickStats />

        {/* Templates Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Signatur-Vorlagen
            </h2>
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
        </section>
      </main>
    </div>
  );
}
