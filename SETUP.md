# Setup Guide - Guschlbauer Signature Manager

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung.

## Voraussetzungen

- Node.js 18 oder höher
- Ein Microsoft 365 Business Tenant mit Admin-Zugang
- Git

## Teil 1: Azure AD App Registration

### 1.1 Neue App registrieren

1. Öffne das [Azure Portal](https://portal.azure.com)
2. Navigiere zu **Azure Active Directory** → **App registrations**
3. Klicke auf **New registration**
4. Fülle aus:
   - Name: `Guschlbauer Signature Manager`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: `Web` → `http://localhost:3000` (später Vercel-URL hinzufügen)
5. Klicke auf **Register**

### 1.2 Client Secret erstellen

1. In deiner neuen App, gehe zu **Certificates & secrets**
2. Klicke auf **New client secret**
3. Beschreibung: `Signature Manager Secret`
4. Ablauf: 24 Monate (oder nach Sicherheitsrichtlinie)
5. **WICHTIG**: Kopiere das Secret sofort - es wird nur einmal angezeigt!

### 1.3 API Permissions hinzufügen

1. Gehe zu **API permissions**
2. Klicke **Add a permission** → **Microsoft Graph**
3. Wähle **Application permissions** und füge hinzu:
   - `User.Read.All` (für Server-Abfragen)
4. Wähle **Delegated permissions** und füge hinzu:
   - `User.Read` (für Client-Login)
5. Klicke auf **Grant admin consent for [Dein Tenant]**

### 1.4 Werte notieren

Notiere dir diese Werte (findest du unter **Overview**):
- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Client Secret**: (den du eben erstellt hast)

## Teil 2: Lokale Entwicklung

### 2.1 Repository klonen und Dependencies installieren

```bash
git clone <repo-url>
cd guschlbauer-signatures
npm install
```

### 2.2 Environment Variables konfigurieren

```bash
cd apps/admin
cp .env.example .env.local
```

Öffne `.env.local` und fülle die Azure AD Werte ein:

```env
AZURE_AD_CLIENT_ID=deine-client-id
AZURE_AD_CLIENT_SECRET=dein-client-secret
AZURE_AD_TENANT_ID=deine-tenant-id

NEXT_PUBLIC_AZURE_AD_CLIENT_ID=deine-client-id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=deine-tenant-id
```

### 2.3 Admin-Dashboard starten

```bash
# Im Root-Verzeichnis
npm run dev:admin
```

Öffne http://localhost:3000

## Teil 3: Outlook Add-In Deployment

### 3.1 Add-In für Entwicklung testen (Sideloading)

1. Öffne Outlook im Web (outlook.office.com)
2. Gehe zu einer neuen E-Mail
3. Klicke auf **...** → **Get Add-ins**
4. Wähle **My add-ins** → **Add a custom add-in** → **Add from file**
5. Wähle die `apps/outlook-addin/manifest.xml`

### 3.2 Manifest für Produktion anpassen

Ersetze in `manifest.xml` alle Vorkommen von `https://your-domain.vercel.app` mit deiner echten URL.

### 3.3 Add-In zentral deployen (für alle User)

1. Öffne das [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Gehe zu **Settings** → **Integrated apps**
3. Klicke **Upload custom apps**
4. Wähle **Office Add-in** und lade dein `manifest.xml` hoch
5. Wähle **Entire organization** oder spezifische Gruppen
6. Klicke **Deploy**

Das Add-In erscheint dann automatisch bei allen Usern in Outlook.

## Teil 4: Vercel Deployment

### 4.1 Mit Vercel verbinden

```bash
npm i -g vercel
cd apps/admin
vercel
```

### 4.2 Environment Variables in Vercel

1. Öffne dein Projekt auf vercel.com
2. Gehe zu **Settings** → **Environment Variables**
3. Füge hinzu:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`
   - `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`
   - `NEXT_PUBLIC_AZURE_AD_TENANT_ID`

### 4.3 Azure AD Redirect URI aktualisieren

1. Zurück im Azure Portal → Deine App Registration
2. Gehe zu **Authentication**
3. Füge unter **Redirect URIs** hinzu:
   - `https://deine-app.vercel.app`
   - `https://deine-app.vercel.app/api/auth/callback`

## Teil 5: Logo hochladen

1. Öffne das Admin-Dashboard
2. Gehe zu **Assets**
3. Lade dein Firmenlogo hoch (PNG oder SVG, max 2MB)
4. Das Logo wird automatisch in alle Signaturen eingebettet

## Fehlerbehebung

### "AADSTS50011: The redirect URI is not valid"
→ Prüfe ob die Redirect URI in Azure AD exakt mit deiner URL übereinstimmt

### "User not found in Azure AD"
→ Prüfe ob der User eine gültige E-Mail-Adresse in Azure AD hat

### Add-In lädt nicht
→ Prüfe die Browser-Konsole auf Fehler
→ Stelle sicher dass HTTPS aktiv ist (Vercel macht das automatisch)

### Signatur wird nicht eingefügt
→ Prüfe ob die API erreichbar ist
→ Prüfe die Netzwerk-Tab für API-Fehler

## Support

Bei Fragen: [Deine Kontaktdaten hier]
