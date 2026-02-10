# Guschlbauer Signature Manager

Zentrale Verwaltung von Outlook-Signaturen für alle Mitarbeiter mit automatischer Einfügung beim Mail-Versand.

## 🎯 Funktionen

- **Admin-Dashboard**: Signatur-Vorlagen erstellen und verwalten
- **Outlook Add-In**: Automatisches Einfügen der Signatur beim Verfassen
- **Azure AD Integration**: User-Daten (Name, Position, Telefon) automatisch befüllen
- **Inline-Bilder**: Logo wird Base64-eingebettet (immer sichtbar, kein "Bilder laden")

## 📁 Projektstruktur

```
guschlbauer-signatures/
├── apps/
│   ├── admin/              # Next.js Admin-Dashboard
│   │   ├── src/
│   │   │   ├── app/        # App Router
│   │   │   ├── components/ # React Components
│   │   │   └── lib/        # Utilities, API-Clients
│   │   └── public/         # Statische Assets
│   │
│   └── outlook-addin/      # Outlook Add-In
│       ├── src/
│       │   ├── taskpane/   # Add-In UI
│       │   └── commands/   # Office.js Commands
│       └── manifest.xml    # Add-In Manifest
│
├── packages/
│   ├── shared/             # Geteilte Types & Utils
│   └── api/                # API Routes (in Admin integriert)
│
└── docker-compose.yml      # Lokale Entwicklung
```

## 🔧 Tech Stack

- **Admin**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Add-In**: Office.js, TypeScript, React
- **Datenbank**: SQLite (Turso) oder PostgreSQL
- **Auth**: Azure AD / Entra ID
- **Hosting**: Vercel (kostenlos für diese Größe)

## 🚀 Quick Start

```bash
# Dependencies installieren
npm install

# Lokale Entwicklung starten
npm run dev

# Add-In lokal testen (sideloading)
npm run dev:addin
```

## ⚙️ Konfiguration

### 1. Azure AD App Registration

1. Azure Portal → App registrations → New registration
2. Name: "Guschlbauer Signature Manager"
3. Redirect URI: `https://signatures.guschlbauer.cc` (SPA-Plattform)
4. API Permissions hinzufügen:
   - `User.Read` (delegated)
   - `User.Read.All` (application) - für Admin-Abfragen

### 2. Environment Variables

```env
# .env.local
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Datenbank
DATABASE_URL=your-database-url

# Optional: Vercel Blob für Logo-Upload
BLOB_READ_WRITE_TOKEN=your-token
```

## 📧 Signatur-Platzhalter

Verfügbare Variablen in Templates:

| Platzhalter | Beschreibung | Quelle |
|-------------|--------------|--------|
| `{{displayName}}` | Voller Name | Azure AD |
| `{{jobTitle}}` | Position/Titel | Azure AD |
| `{{department}}` | Abteilung | Azure AD |
| `{{mail}}` | E-Mail-Adresse | Azure AD |
| `{{mobilePhone}}` | Mobilnummer | Azure AD |
| `{{businessPhones}}` | Festnetznummer | Azure AD |
| `{{officeLocation}}` | Standort | Azure AD |

## 🔐 Sicherheit

- Alle API-Calls authentifiziert via Azure AD
- Add-In läuft nur für User mit gültiger M365-Lizenz
- Keine sensiblen Daten im Frontend gespeichert
- HTTPS erzwungen (Vercel macht das automatisch)

## 📄 Lizenz

Proprietär - Guschlbauer Backwaren GmbH
