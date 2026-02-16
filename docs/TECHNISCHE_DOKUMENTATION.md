# Technische Dokumentation - Guschlbauer Signatur Manager

## Inhaltsverzeichnis

1. [Systemübersicht](#1-systemübersicht)
2. [Architektur](#2-architektur)
3. [Technologie-Stack](#3-technologie-stack)
4. [Hosting & Infrastruktur](#4-hosting--infrastruktur)
5. [Projektstruktur](#5-projektstruktur)
6. [Datenbank](#6-datenbank)
7. [API-Referenz](#7-api-referenz)
8. [Authentifizierung & Sicherheit](#8-authentifizierung--sicherheit)
9. [Outlook Add-In](#9-outlook-add-in)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Lokale Entwicklung](#11-lokale-entwicklung)
12. [Deployment](#12-deployment)
13. [Wartung & Troubleshooting](#13-wartung--troubleshooting)

---

## 1. Systemübersicht

Der Guschlbauer Signatur Manager ist ein zentrales System zur Verwaltung und Verteilung von E-Mail-Signaturen für die Guschlbauer Backwaren GmbH. Es besteht aus drei Hauptkomponenten:

| Komponente | Beschreibung | Technologie |
|---|---|---|
| **Admin-Panel** | Web-Oberfläche zur Verwaltung von Vorlagen, Assets und Zuweisungen | Next.js 14 |
| **REST API** | Backend-Schnittstelle für Signatur-Generierung und Datenverwaltung | Next.js API Routes |
| **Outlook Add-In** | Integration in Microsoft Outlook für automatische Signatur-Einfügung | Office.js + React |

---

## 2. Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Hetzner VPS (Ubuntu)                       │
│                                                               │
│  ┌─────────┐     ┌──────────────────────┐     ┌───────────┐ │
│  │  nginx   │────▶│   Next.js App        │     │  SQLite   │ │
│  │  :80/443 │     │   :3000              │────▶│  Database │ │
│  │  + SSL   │     │                      │     │  /data/   │ │
│  └─────────┘     │  ├── Admin UI         │     └───────────┘ │
│       ▲           │  ├── API Routes       │                    │
│       │           │  └── Add-In Static    │                    │
│       │           └──────────────────────┘                    │
└───────│───────────────────────────────────────────────────────┘
        │
        │ HTTPS
        │
   ┌────┴────┐          ┌──────────────┐
   │ Browser │          │ Outlook      │
   │ Admin   │          │ Add-In       │
   └─────────┘          │ (Office.js)  │
                        └──────────────┘
                              │
                              │ API Calls
                              ▼
                    /api/signature?email=...
                    /api/templates
                    /api/assets/serve
```

### Datenfluss Signatur-Einfügung
1. Outlook Add-In liest E-Mail-Adresse des Benutzers via `Office.context.mailbox.userProfile`
2. Add-In ruft `GET /api/signature?email=...&embed=cid` auf
3. API holt Benutzerdaten (Azure AD oder Mock), Template und Assets
4. API rendert HTML mit personalisierten Daten und CID-Referenzen für Bilder
5. API liefert HTML + Base64-Attachments zurück
6. Add-In fügt Inline-Attachments via `addFileAttachmentFromBase64Async` hinzu
7. Add-In setzt Signatur via `setSignatureAsync` (Cursor bleibt oben)

---

## 3. Technologie-Stack

### Frontend (Admin-Panel)
| Technologie | Version | Verwendung |
|---|---|---|
| Next.js | 14.1.0 | React-Framework mit SSR und API Routes |
| React | 18.2.0 | UI-Bibliothek |
| TypeScript | 5.4+ | Typsicherheit |
| Tailwind CSS | 3.4+ | Styling |
| @azure/msal-react | 2.x | Azure AD Authentifizierung |
| lucide-react | - | Icons |

### Backend (API)
| Technologie | Version | Verwendung |
|---|---|---|
| Next.js API Routes | 14.1.0 | REST API Endpoints |
| better-sqlite3 | - | SQLite-Datenbank |
| jose | - | JWT-Validierung für Azure AD Tokens |
| @microsoft/microsoft-graph-client | - | Azure AD Benutzerdaten |

### Outlook Add-In
| Technologie | Version | Verwendung |
|---|---|---|
| Office.js | - | Outlook Integration |
| React | 18.2.0 | Taskpane UI |
| Webpack | 5.x | Bundling |
| TypeScript | 5.4+ | Typsicherheit |

### Shared Package
| Export | Typ | Beschreibung |
|---|---|---|
| `AzureADUser` | Interface | Benutzerdaten aus Microsoft Graph |
| `SignatureTemplate` | Interface | Signatur-Vorlage (inkl. `htmlContentReply`) |
| `SignatureAsset` | Interface | Bild/Logo Asset |
| `TEMPLATE_PLACEHOLDERS` | Konstante | Verfügbare Platzhalter-Zuordnungen |
| `renderTemplate()` | Funktion | Ersetzt Platzhalter im HTML mit Benutzerdaten |
| `htmlToPlainText()` | Funktion | Konvertiert HTML zu Plaintext |

### Infrastruktur
| Technologie | Verwendung |
|---|---|
| Docker + Docker Compose | Container-Orchestrierung |
| nginx | Reverse Proxy + SSL Termination |
| Let's Encrypt (certbot) | SSL-Zertifikate |
| GitHub Actions | CI/CD Pipeline |
| GitHub Container Registry (GHCR) | Docker Image Registry |

---

## 4. Hosting & Infrastruktur

### Server
| Eigenschaft | Wert |
|---|---|
| **Provider** | Hetzner Cloud |
| **Server-Typ** | CX22 (2 vCPU, 4 GB RAM) |
| **Betriebssystem** | Ubuntu 24.04 LTS |
| **IP-Adresse** | 46.225.61.236 |
| **Domain** | signatures.guschlbauer.cc |
| **SSL** | Let's Encrypt (automatische Erneuerung) |

### Docker Container
| Container | Image | Port | Funktion |
|---|---|---|---|
| `guschlbauer-signatures` | Custom (Dockerfile) | 3000 (intern) | Next.js App + API |
| `guschlbauer-nginx` | nginx:alpine | 80, 443 | Reverse Proxy + SSL |
| `guschlbauer-certbot` | certbot/certbot | - | SSL-Zertifikat-Erneuerung |

### Docker Volumes
| Volume | Mount | Inhalt |
|---|---|---|
| `app-data` | `/data` | SQLite-Datenbank |
| `uploads` | `/app/uploads` | Hochgeladene Dateien |
| `certbot-etc` | `/etc/letsencrypt` | SSL-Zertifikate |
| `certbot-var` | `/var/lib/letsencrypt` | Certbot-Daten |
| `web-root` | `/var/www/html` | ACME Challenge Files |

### nginx-Konfiguration
- Reverse Proxy zu Next.js auf Port 3000
- SSL-Termination mit Let's Encrypt
- Gzip-Kompression (Level 6)
- Security Headers (X-Frame-Options, X-Content-Type-Options, XSS-Protection)
- HTTP → HTTPS Redirect
- ACME Challenge Location für Certbot

### DNS
| Record | Typ | Wert |
|---|---|---|
| `signatures.guschlbauer.cc` | A | 46.225.61.236 |

---

## 5. Projektstruktur

```
guschlbauer-signatures/
├── apps/
│   ├── admin/                      # Next.js Admin-Panel + API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx            # Dashboard
│   │   │   │   ├── layout.tsx          # Root Layout + Providers
│   │   │   │   ├── templates/
│   │   │   │   │   ├── page.tsx        # Vorlagen-Übersicht
│   │   │   │   │   ├── new/page.tsx    # Neue Vorlage erstellen
│   │   │   │   │   └── [id]/page.tsx   # Vorlage bearbeiten
│   │   │   │   ├── assets/page.tsx     # Assets verwalten
│   │   │   │   ├── users/page.tsx      # Mitarbeiter & Zuweisungen
│   │   │   │   └── api/
│   │   │   │       ├── health/route.ts     # Healthcheck
│   │   │   │       ├── templates/route.ts  # CRUD Templates
│   │   │   │       ├── assets/
│   │   │   │       │   ├── route.ts        # CRUD Assets
│   │   │   │       │   └── serve/route.ts  # Bild-Auslieferung (public)
│   │   │   │       ├── users/route.ts      # Benutzer + Zuweisungen
│   │   │   │       ├── signature/route.ts  # Signatur-Generierung
│   │   │   │       └── stats/route.ts      # Dashboard-Statistiken
│   │   │   ├── components/
│   │   │   │   ├── header.tsx              # Navigation
│   │   │   │   ├── auth-guard.tsx          # Login-Schutz
│   │   │   │   ├── template-list.tsx       # Vorlagen-Tabelle
│   │   │   │   ├── quick-stats.tsx         # Statistik-Kacheln
│   │   │   │   ├── signature-editor.tsx    # HTML-Editor
│   │   │   │   └── signature-preview.tsx   # Live-Vorschau
│   │   │   └── lib/
│   │   │       ├── db.ts                   # SQLite Verbindung + Schema
│   │   │       ├── auth.ts                 # Token-Validierung
│   │   │       ├── templates.ts            # Template Data Layer
│   │   │       ├── assets.ts               # Asset Data Layer
│   │   │       ├── graph-client.ts         # Microsoft Graph API
│   │   │       ├── mock-data.ts            # Demo-Benutzer
│   │   │       ├── rate-limit.ts           # Rate Limiter
│   │   │       └── use-auth-fetch.ts       # Auth-Fetch Hook
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── .env.local                      # Lokale Umgebungsvariablen
│   │
│   └── outlook-addin/              # Outlook Add-In
│       ├── src/
│       │   ├── commands/commands.ts     # Ribbon-Commands + Auto-Signatur
│       │   └── taskpane/
│       │       ├── taskpane.tsx          # Einstellungsfenster
│       │       └── taskpane.css         # Taskpane Styles
│       ├── manifest.xml                 # Office Add-In Manifest (Legacy)
│       ├── manifest.json                # Unified Manifest (Teams)
│       ├── webpack.config.js
│       └── assets/                      # Icons für Ribbon
│
├── packages/
│   └── shared/                     # Geteilte Types + Utilities
│       └── src/index.ts
│
├── docs/                           # Dokumentation
│   ├── BEDIENUNGSANLEITUNG.md
│   └── TECHNISCHE_DOKUMENTATION.md
│
├── nginx/                          # nginx-Konfiguration
│   ├── nginx.conf
│   └── conf.d/app.conf.template
│
├── scripts/
│   └── setup-hetzner.sh            # Server-Setup-Script
│
├── .github/workflows/
│   └── deploy.yml                   # CI/CD Pipeline
│
├── Dockerfile                       # Production Build
├── docker-compose.yml               # Production Stack
├── docker-compose.dev.yml           # Development Stack
├── .dockerignore
├── .env.example                     # Umgebungsvariablen-Vorlage
├── DEPLOYMENT.md                    # Deployment-Anleitung
├── turbo.json                       # Turborepo Config
└── package.json                     # Root Monorepo
```

---

## 6. Datenbank

### Technologie
- **Engine**: SQLite 3 (via `better-sqlite3`)
- **Datei**: `/data/signatures.db` (Docker Volume `app-data`)
- **Initialisierung**: Automatisch beim ersten Start (Schema + Default-Daten)

### Schema

#### `templates`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Eindeutige ID (z.B. "default") |
| `name` | TEXT NOT NULL | Anzeigename |
| `description` | TEXT | Beschreibung |
| `html_content` | TEXT NOT NULL | HTML-Template mit Platzhaltern (vollständige Signatur) |
| `html_content_reply` | TEXT | HTML-Template für Antwort-Signatur (kurze Grußformel) |
| `is_default` | INTEGER DEFAULT 0 | 1 = Standard-Vorlage |
| `is_active` | INTEGER DEFAULT 1 | 0 = gelöscht (Soft Delete) |
| `created_at` | TEXT | Erstellungszeitpunkt (ISO) |
| `updated_at` | TEXT | Letzte Änderung (ISO) |
| `created_by` | TEXT | E-Mail des Erstellers |

#### `assets`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Platzhalter-ID (z.B. "logo", "banner") |
| `name` | TEXT NOT NULL | Anzeigename |
| `mime_type` | TEXT NOT NULL | MIME-Type (image/png, image/jpeg, ...) |
| `base64_data` | TEXT NOT NULL | Base64-encodiertes Bild (data:URL) |
| `width` | INTEGER | Breite in Pixel (optional) |
| `height` | INTEGER | Höhe in Pixel (optional) |
| `html_tag` | TEXT | Optionaler HTML-Tag mit `{{src}}` Platzhalter |
| `created_at` | TEXT | Erstellungszeitpunkt (ISO) |

#### `user_templates`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `user_email` | TEXT PRIMARY KEY | E-Mail des Mitarbeiters |
| `template_id` | TEXT | Zugewiesene Vorlage-ID |
| `assigned_at` | TEXT | Zuweisungszeitpunkt (ISO) |

#### `audit_log`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-Increment ID |
| `action` | TEXT | Aktion (create, update, delete) |
| `resource_type` | TEXT | Ressource (template, asset, user_template) |
| `resource_id` | TEXT | ID der betroffenen Ressource |
| `user_id` | TEXT | E-Mail des ausführenden Benutzers |
| `details` | TEXT | JSON mit zusätzlichen Informationen |
| `timestamp` | TEXT | Zeitstempel (ISO) |

### Geschäftsregeln
- Template mit ID `"default"` kann nicht gelöscht werden
- Asset mit ID `"logo"` kann nicht gelöscht werden
- Löschen von Templates = Soft Delete (`is_active = 0`)
- Beim ersten Start wird ein Default-Template und ein Placeholder-SVG-Logo erstellt

---

## 7. API-Referenz

Basis-URL: `https://signatures.guschlbauer.cc/api`

### Authentifizierung
Alle Endpunkte (außer `/health` und `/assets/serve`) erfordern:
- `Authorization: Bearer <Azure-AD-Token>` (Admin-UI und Outlook Add-In SSO)

### Endpunkte

#### `GET /api/health`
Healthcheck (keine Auth erforderlich).

**Response:**
```json
{ "status": "ok", "timestamp": "2026-02-10T12:00:00Z", "version": "1.0.0" }
```

---

#### `GET /api/templates`
Alle aktiven Vorlagen auflisten.

**Response:**
```json
{ "items": [{ "id": "default", "name": "Standard Signatur", "description": "...", "htmlContent": "...", "htmlContentReply": "...", "isDefault": true, "isActive": true, "createdAt": "...", "updatedAt": "..." }], "total": 1 }
```

#### `GET /api/templates?id=default`
Einzelne Vorlage laden.

#### `POST /api/templates`
Neue Vorlage erstellen.

**Body:**
```json
{ "name": "Neue Vorlage", "description": "...", "htmlContent": "<table>...</table>", "htmlContentReply": "<p>Freundliche Grüße<br><strong>{{displayName}}</strong></p>", "isDefault": false }
```

#### `PUT /api/templates`
Vorlage aktualisieren.

**Body:**
```json
{ "id": "default", "name": "Standard Signatur", "htmlContent": "...", "htmlContentReply": "...", "isDefault": true }
```

#### `DELETE /api/templates?id=xyz`
Vorlage deaktivieren (Soft Delete).

---

#### `GET /api/assets`
Alle Assets auflisten (inkl. Base64-Daten).

#### `POST /api/assets`
Neues Asset hochladen (multipart/form-data).

**Form Fields:**
- `file` (required): Bilddatei
- `name` (optional): Anzeigename
- `customId` (optional): Platzhalter-ID (nur `[a-z0-9-]`)
- `htmlTag` (optional): HTML-Tag mit `{{src}}`

#### `PUT /api/assets`
Asset-Datei ersetzen (multipart/form-data).

**Form Fields:**
- `id` (required): Asset-ID
- `file` (required): Neue Bilddatei

#### `PATCH /api/assets`
Asset-Metadaten aktualisieren.

**Body:**
```json
{ "id": "banner", "name": "Neuer Name", "htmlTag": "<img src=\"{{src}}\" />" }
```

#### `DELETE /api/assets?id=xyz`
Asset löschen (Logo nicht löschbar).

#### `GET /api/assets/serve?id=logo`
Asset als Bild ausliefern (public, keine Auth).

**Response:** Binäre Bilddatei mit `Content-Type` Header. Cache: 24 Stunden.

---

#### `GET /api/signature`
Personalisierte Signatur generieren.

**Query-Parameter:**
| Parameter | Required | Beschreibung |
|---|---|---|
| `email` | Ja | E-Mail des Benutzers |
| `templateId` | Nein | Spezifische Vorlage (Standard: zugewiesene oder Default) |
| `embed` | Nein | Bild-Einbettungsmodus: `inline` (Base64), `url` (Server-URLs), `cid` (Content-ID) |
| `type` | Nein | `full` (Standard) oder `reply`. Bei `reply` wird `html_content_reply` des Templates verwendet |

**Signatur-Marker:**
Bei `type=full` wird die HTML-Ausgabe mit `<!-- gsig -->` HTML-Kommentaren umschlossen. Das Outlook Add-In erkennt damit, ob die volle Signatur bereits im E-Mail-Thread vorhanden ist.

**Response (embed=cid):**
```json
{
  "html": "<!-- gsig --><table>...cid:logo.jpeg...</table><!-- /gsig -->",
  "plainText": "Max Mustermann\nGeschäftsführer\n...",
  "templateId": "default",
  "userId": "mock-1",
  "generatedAt": "2026-02-10T12:00:00Z",
  "attachments": [
    { "id": "logo", "filename": "logo.jpeg", "mimeType": "image/jpeg", "base64": "..." }
  ]
}
```

---

#### `GET /api/users`
Alle Benutzer mit Template-Zuweisungen.

**Response:**
```json
{
  "items": [{ "id": "mock-1", "displayName": "Max Mustermann", "mail": "...", "jobTitle": "...", "assignedTemplateId": "default", "assignedTemplateName": "Standard Signatur" }],
  "total": 5,
  "source": "mock"
}
```

#### `POST /api/users`
Template einem Benutzer zuweisen.

**Body:**
```json
{ "email": "max.mustermann@guschlbauer.at", "templateId": "default" }
```

---

#### `GET /api/stats`
Dashboard-Statistiken.

**Response:**
```json
{ "templates": 2, "assets": 3, "users": 5 }
```

---

## 8. Authentifizierung & Sicherheit

### Authentifizierungsmodi

| Modus | Header | Verwendung |
|---|---|---|
| **Azure AD Token** | `Authorization: Bearer <idToken>` | Admin-UI im Browser |
| **Azure AD SSO** | `Authorization: Bearer <ssoToken>` | Outlook Add-In (via `Office.auth.getAccessTokenAsync()`) |
| **DEV_MODE** | keiner nötig | Lokale Entwicklung |

### Azure AD Integration
- **MSAL.js** für Browser-basierte Authentifizierung
- Token-Validierung via **jose** (JWKS von Microsoft)
- ID-Token wird validiert (nicht Access Token)
- Benötigte Azure AD Permissions: `User.Read` (delegated), `User.Read.All` (application)

### Outlook Add-In SSO
- Nutzt `Office.auth.getAccessTokenAsync()` für Azure AD Token aus der Outlook-Session
- Token wird vom Backend wie Admin-UI-Tokens validiert (gleiche `validateAzureADToken()`)
- SSO-Token wird 4 Minuten im Add-In gecacht
- Azure AD App Registration benötigt "Expose an API" mit `access_as_user` Scope und autorisierten Office Client IDs

### Sicherheitsmaßnahmen

| Maßnahme | Details |
|---|---|
| **CORS** | Eingeschränkt auf `ALLOWED_ORIGINS` (konfigurierbar) |
| **Rate Limiting** | 60 Anfragen/Minute pro IP-Adresse (In-Memory) |
| **Security Headers** | X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Referrer-Policy: strict-origin-when-cross-origin |
| **HTTPS** | Erzwungen via nginx + Let's Encrypt |
| **AuthGuard** | UI blockiert ohne gültige Anmeldung |
| **Soft Delete** | Templates werden nicht physisch gelöscht |
| **Audit Log** | Alle Änderungen werden protokolliert |

---

## 9. Outlook Add-In

### Manifest-Typen
| Datei | Format | Verwendung |
|---|---|---|
| `manifest.xml` | Office XML Manifest | Legacy-Kompatibilität, Sideloading |
| `manifest.json` | Unified Manifest (Teams) | Moderne Bereitstellung via M365 Admin Center |

### Funktionen

| Funktion | Trigger | Verhalten |
|---|---|---|
| `insertSignature` | Ribbon-Button "Signatur einfügen" | Intern → Antwort-Signatur, Extern → volle Signatur |
| `onNewMessageComposeHandler` | LaunchEvent (neue Mail) | Wählt Signatur basierend auf Empfänger und Thread-Kontext |
| `onMessageRecipientsChangedHandler` | LaunchEvent (Empfänger geändert) | Wechselt automatisch zwischen voller und kurzer Signatur |
| `openTaskpane` | Ribbon-Button "Einstellungen" | Öffnet Taskpane mit Template-Auswahl |

### Signatur-Auswahl-Logik

Die Signatur wird automatisch basierend auf zwei Faktoren gewählt:

1. **Empfänger-Typ** (intern/extern):
   - Nur interne Empfänger (`@guschlbauer.at` / `@guschlbauer.cc`) → **immer kurze Antwort-Signatur**
   - Mindestens ein externer Empfänger → Prüfung auf Thread-Signatur (siehe Punkt 2)

2. **Thread-Signatur-Erkennung** (nur bei externen Empfängern):
   - Beim Öffnen des Compose-Fensters wird **einmalig** geprüft, ob der E-Mail-Body bereits eine Guschlbauer-Signatur enthält (z.B. bei Antworten)
   - Erkennung über: HTML-Kommentar `<!-- gsig -->`, Legacy-Kommentar `<!-- guschlbauer-signature -->`, oder Firmenname "Guschlbauer Backwaren" im Body
   - Thread hat Signatur → **kurze Antwort-Signatur** (volle ist schon im Thread sichtbar)
   - Thread hat keine Signatur → **volle Signatur**

**Wichtig:** Die Thread-Prüfung (`threadHasSignature`) wird nur VOR dem Einfügen der eigenen Signatur durchgeführt, um False Positives durch die eigene gerade eingefügte Signatur zu vermeiden.

### Empfänger-Wechsel

Bei Änderung der Empfänger wird die Signatur automatisch gewechselt:
- Extern → Intern: Wechsel auf kurze Signatur
- Intern → Extern: Wechsel auf volle Signatur (wenn Thread keine Signatur hat)
- Unnötige Wechsel werden über `currentSignatureType` Tracking vermieden

### Bild-Einbettung (CID)
1. API liefert HTML mit `cid:logo.jpeg` Referenzen + Base64-Attachments
2. Add-In fügt Attachments via `addFileAttachmentFromBase64Async` mit `isInline: true` hinzu
3. Fallback: `addFileAttachmentAsync` mit Server-URL für ältere Outlook-Versionen

### Signatur-Platzierung
- **`setSignatureAsync`** (Mailbox API 1.10+): Platziert Signatur am Ende, Cursor bleibt am Anfang
- **Fallback** (`body.setAsync`): Fügt Signatur am Ende des Body ein, markiert mit HTML-Kommentaren (`<!-- guschlbauer-signature -->`)

### Cache
- Volle Signaturen werden 5 Minuten im Speicher gecacht
- Antwort-Signaturen haben einen separaten Cache (ebenfalls 5 Minuten)
- SSO-Token wird 4 Minuten gecacht
- "Daten aktualisieren" im Taskpane invalidiert den Cache

### API-Konfiguration
| Variable | Beschreibung |
|---|---|
| `API_URL` | Basis-URL der API (Default: `https://signatures.guschlbauer.cc/api`) |

---

## 10. CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```
Push/PR auf main
       │
       ▼
  ┌─────────┐
  │  check   │  npm ci + type-check
  └────┬─────┘
       │ (nur Push auf main)
       ▼
  ┌─────────┐
  │  build   │  Docker Image → GHCR (ghcr.io)
  └────┬─────┘
       │
       ▼
  ┌─────────┐
  │  deploy  │  SSH → docker pull + restart
  └─────────┘
```

### Jobs im Detail

**1. check** (bei jedem Push und PR auf `main`)
- Node.js 20 Setup
- `npm ci` (Clean Install)
- `npm run type-check` (TypeScript-Prüfung)

**2. build** (nur Push auf `main`, nach erfolgreichem check)
- Docker Login bei GHCR
- Docker Image bauen mit Build-Args:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`
  - `NEXT_PUBLIC_AZURE_AD_TENANT_ID`
- Push zu `ghcr.io/<repo>:latest` und `ghcr.io/<repo>:sha-<commit>`

**3. deploy** (nur Push auf `main`, nach erfolgreichem build)
- SSH-Verbindung zum Server
- Docker Image pullen
- `docker compose up -d --force-recreate app`
- Alte Images bereinigen

### Benötigte GitHub Secrets

| Secret | Beschreibung |
|---|---|
| `APP_URL` | `https://signatures.guschlbauer.cc` |
| `AZURE_AD_CLIENT_ID` | Azure AD Application (Client) ID |
| `AZURE_AD_TENANT_ID` | Azure AD Directory (Tenant) ID |
| `SERVER_HOST` | Server IP/Hostname |
| `SERVER_USER` | SSH-Benutzer (z.B. `root`) |
| `SSH_PRIVATE_KEY` | Privater SSH-Schlüssel |

### Manuelles Deployment (ohne CI/CD)

```bash
ssh root@46.225.61.236
cd /opt/guschlbauer-signatures
git pull
docker compose up --build -d
```

---

## 11. Lokale Entwicklung

### Voraussetzungen
- Node.js >= 18
- npm >= 10
- Git

### Setup

```bash
# Repository klonen
git clone https://github.com/guschlbauermichael93/guschlbauer-signatures.git
cd guschlbauer-signatures

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp apps/admin/.env.example apps/admin/.env.local
# In .env.local: DEV_MODE=true setzen
```

### Development Server starten

```bash
npm run dev:admin    # Admin-Panel auf http://localhost:3000
npm run dev:addin    # Outlook Add-In (Webpack Dev Server)
```

### DEV_MODE
Im Entwicklungsmodus (`DEV_MODE=true`):
- Keine Azure AD Anmeldung erforderlich
- API-Anfragen werden ohne Token akzeptiert
- 5 Demo-Benutzer (österreichische Namen) werden verwendet
- Datenbank wird automatisch mit Default-Template und Placeholder-Logo initialisiert

### Mock-Benutzer

| Name | E-Mail | Position |
|---|---|---|
| Max Mustermann | max.mustermann@guschlbauer.at | Geschäftsführer |
| Anna Bäcker | anna.baecker@guschlbauer.at | Produktionsleiterin |
| Peter Mehl | peter.mehl@guschlbauer.at | Vertriebsleiter |
| Maria Korn | maria.korn@guschlbauer.at | Buchhaltung |
| Thomas Teig | thomas.teig@guschlbauer.at | Bäckermeister |

---

## 12. Deployment

### Erstmalige Server-Einrichtung

1. **Hetzner VPS bestellen**: CX22 (2 vCPU, 4 GB RAM), Ubuntu 24.04
2. **DNS konfigurieren**: A-Record `signatures.guschlbauer.cc` → Server-IP
3. **Setup-Script ausführen**:
   ```bash
   scp scripts/setup-hetzner.sh root@<server-ip>:/root/
   ssh root@<server-ip>
   chmod +x setup-hetzner.sh
   ./setup-hetzner.sh
   ```
4. **`.env` Datei konfigurieren** in `/opt/guschlbauer-signatures/`
5. **Starten**:
   ```bash
   cd /opt/guschlbauer-signatures
   docker compose up -d
   ```

### Umgebungsvariablen (Production)

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DOMAIN` | Domain für SSL | `signatures.guschlbauer.cc` |
| `SSL_EMAIL` | E-Mail für Let's Encrypt | `admin@guschlbauer.at` |
| `APP_URL` | Öffentliche URL | `https://signatures.guschlbauer.cc` |
| `AZURE_AD_CLIENT_ID` | Azure AD App ID | `20f25f38-...` |
| `AZURE_AD_CLIENT_SECRET` | Azure AD Secret | `***` |
| `AZURE_AD_TENANT_ID` | Azure AD Tenant | `abc123-...` |
| `ALLOWED_ORIGINS` | Erlaubte CORS-Origins | `https://signatures.guschlbauer.cc` |
| `DEV_MODE` | Entwicklungsmodus | `false` |

### Outlook Add-In bereitstellen

1. **Manifest anpassen**: Domain und GUID in `manifest.json` ersetzen
2. **M365 Admin Center**: https://admin.microsoft.com → Settings → Integrated apps → Upload custom app
3. **Oder Sideloading** (zum Testen): In Outlook Web → Add-Ins verwalten → Custom Add-Ins → manifest.xml hochladen

---

## 13. Wartung & Troubleshooting

### Logs einsehen

```bash
# Alle Container
docker compose logs -f

# Nur App
docker compose logs -f app

# Letzte 100 Zeilen
docker compose logs --tail=100 app
```

### Container-Status

```bash
docker compose ps
docker compose top
```

### Neustart

```bash
# Einzelner Container
docker compose restart app

# Alles neu bauen
docker compose up --build -d
```

### Datenbank-Backup

```bash
# Backup erstellen
docker compose exec app cp /data/signatures.db /data/signatures.db.backup

# Backup auf lokalen Rechner kopieren
docker cp guschlbauer-signatures:/data/signatures.db ./backup-$(date +%Y%m%d).db
```

### SSL-Zertifikat erneuern

```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

Automatisierung via Cron (empfohlen):
```bash
echo "0 3 * * 1 cd /opt/guschlbauer-signatures && docker compose run --rm certbot renew && docker compose restart nginx" | crontab -
```

### Häufige Probleme

| Problem | Ursache | Lösung |
|---|---|---|
| Container startet nicht | Port belegt oder fehlende .env | `docker compose logs app` prüfen |
| 401 Unauthorized (Add-In) | SSO-Token ungültig | Azure AD App Registration prüfen (Expose an API + access_as_user Scope) |
| CORS-Fehler | `ALLOWED_ORIGINS` nicht gesetzt | In `.env` die erlaubten Origins eintragen |
| Bilder nicht sichtbar | Asset nicht in DB | Im Admin-Panel unter Assets prüfen |
| Add-In erscheint nicht | Manifest nicht deployed | M365 Admin Center oder Sideloading prüfen |
| "Demo-Daten" Badge | Azure AD nicht konfiguriert | `AZURE_AD_*` Variablen in `.env` setzen |
| SQLite-Fehler | Datei-Permissions | `docker compose exec app chown -R nextjs:nodejs /data` |
| Build-Fehler (better-sqlite3) | Native Module | Dockerfile enthält `python3 make g++` für Alpine |
