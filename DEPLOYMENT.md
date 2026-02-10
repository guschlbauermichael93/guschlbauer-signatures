# Deployment Guide - Hetzner VPS mit Docker

## Übersicht

Die Anwendung wird als Docker-Container auf einem Hetzner VPS betrieben:
- **Next.js App** (Admin-UI + API) im Docker-Container
- **nginx** als Reverse Proxy mit SSL (Let's Encrypt)
- **GitHub Actions** für CI/CD (automatisches Deployment bei Push auf `main`)

---

## 1. Azure AD App-Registrierung

### App erstellen
1. Gehe zu https://portal.azure.com
2. Navigiere zu **Microsoft Entra ID** → **App-Registrierungen** → **Neue Registrierung**
3. Name: `Guschlbauer Signature Manager`
4. Unterstützte Kontotypen: `Nur Konten in diesem Organisationsverzeichnis`
5. Umleitungs-URI: **Web** → `https://deine-domain.example.com/api/auth/callback`
6. **Registrieren** klicken

### API-Berechtigungen
Unter **API-Berechtigungen** → **Berechtigung hinzufügen** → **Microsoft Graph**:

| Berechtigung | Typ | Beschreibung |
|-------------|-----|-------------|
| `User.Read` | Delegiert | Für User-Login |
| `User.Read.All` | Anwendung | Für Admin - alle User lesen |

Danach: **Administratorzustimmung erteilen für [Mandant]** klicken.

### Client Secret erstellen
1. **Zertifikate & Geheimnisse** → **Neuer geheimer Clientschlüssel**
2. Beschreibung: `Production`
3. Ablauf: 24 Monate
4. **WICHTIG**: Secret-Wert sofort kopieren! Wird nur einmal angezeigt.

### Werte notieren
- **Anwendungs-ID (Client ID)**: Übersichtsseite → `Anwendungs-ID (Client)`
- **Verzeichnis-ID (Tenant ID)**: Übersichtsseite → `Verzeichnis-ID (Mandant)`
- **Client Secret**: Der gerade erstellte Secret-Wert

---

## 2. Hetzner VPS Setup

### Server bestellen
1. https://www.hetzner.com/cloud → neuen Server erstellen
2. Empfohlene Konfiguration:
   - **OS**: Ubuntu 24.04
   - **Typ**: CX22 (2 vCPU, 4 GB RAM) oder größer
   - **Standort**: Nürnberg/Falkenstein (niedrige Latenz in AT/DE)
   - **SSH-Key** hinterlegen (empfohlen)

### DNS konfigurieren
Beim Domain-Provider einen A-Record erstellen:
```
signatures.deine-domain.at  →  <Server-IP>
```

### Setup-Script ausführen
```bash
ssh root@<SERVER-IP>

# Repository klonen (oder Dateien hochladen)
git clone https://github.com/your-org/guschlbauer-signatures.git /opt/guschlbauer-signatures
cd /opt/guschlbauer-signatures

# Setup-Script ausführen
chmod +x scripts/setup-hetzner.sh
./scripts/setup-hetzner.sh
```

Das Script installiert Docker, konfiguriert die Firewall und erstellt SSL-Zertifikate.

### .env konfigurieren
Nach dem Setup die `.env` Datei bearbeiten:
```bash
nano /opt/guschlbauer-signatures/.env
```

Alle Azure AD Werte eintragen (siehe Schritt 1). Vorlage: `.env.example`

### Server starten
```bash
cd /opt/guschlbauer-signatures
docker compose up -d
docker compose logs -f  # Logs prüfen
```

---

## 3. GitHub Actions CI/CD

### Funktionsweise
Die Pipeline (`.github/workflows/deploy.yml`) hat drei Jobs:

1. **check**: Type-Check bei jedem Push und PR
2. **build**: Docker-Image bauen und zu GitHub Container Registry (GHCR) pushen (nur `main`)
3. **deploy**: Per SSH auf den Server, Image pullen und Container neu starten (nur `main`)

### GitHub Secrets konfigurieren
Im GitHub Repository unter **Settings** → **Secrets and variables** → **Actions**:

| Secret | Wert | Beispiel |
|--------|------|---------|
| `APP_URL` | Volle App-URL | `https://signatures.guschlbauer.at` |
| `AZURE_AD_CLIENT_ID` | Azure Client ID | `xxxxxxxx-xxxx-...` |
| `AZURE_AD_TENANT_ID` | Azure Tenant ID | `xxxxxxxx-xxxx-...` |
| `SERVER_HOST` | Server IP oder Hostname | `123.456.789.0` |
| `SERVER_USER` | SSH-Benutzer | `root` |
| `SSH_PRIVATE_KEY` | Privater SSH-Key | Inhalt von `~/.ssh/id_ed25519` |

### Environment erstellen
Unter **Settings** → **Environments** ein Environment `production` erstellen.
Optional: Schutzregeln hinzufügen (z.B. manuelle Genehmigung).

### Deployment auslösen
```bash
git push origin main  # Löst automatisch Build + Deploy aus
```

---

## 4. Outlook Add-In Deployment

Das Add-In wird beim Docker-Build automatisch gebaut und unter `/addin/` bereitgestellt.

### Manifest anpassen

**In `apps/outlook-addin/manifest.json`:**
1. Ersetze alle `https://your-domain.example.com` mit deiner echten Domain
2. Ersetze `YOUR_AZURE_AD_CLIENT_ID` mit deiner Client ID
3. Generiere eine neue GUID für `"id"` (https://www.guidgenerator.com/)

### Add-In im M365 Admin Center hochladen

1. Gehe zu https://admin.microsoft.com
2. **Einstellungen** → **Integrierte Apps** → **Benutzerdefinierte Apps hochladen**
3. App-Typ: **Office Add-in**
4. **Manifestdatei hochladen** → `manifest.json` auswählen
5. Benutzer: **Gesamte Organisation** oder spezifische Gruppen
6. **Bereitstellen**

### Sideloading für Tests
```bash
cd apps/outlook-addin
npm install
npm run dev
```

In Outlook: Neue Mail → **...** → **Add-ins** → **Meine Add-ins** → **Benutzerdefiniertes Add-in hinzufügen** → Datei auswählen.

---

## 5. Wartung & Troubleshooting

### Logs prüfen
```bash
# Alle Container
docker compose logs -f

# Nur App
docker compose logs -f app

# Nur nginx
docker compose logs -f nginx
```

### Container neu starten
```bash
docker compose restart app
```

### Manuelles Update (ohne CI/CD)
```bash
cd /opt/guschlbauer-signatures
git pull
docker compose up -d --build
```

### SSL-Zertifikat erneuern
```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

Am besten als Cronjob einrichten:
```bash
# /etc/crontab - alle 12 Stunden prüfen
0 */12 * * * cd /opt/guschlbauer-signatures && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

### Datenbank-Backup
```bash
# Backup erstellen
docker compose exec app cp /data/signatures.db /data/signatures.db.bak

# Backup auf lokalen Rechner kopieren
scp root@<SERVER-IP>:/opt/guschlbauer-signatures/data/signatures.db ./backup-$(date +%Y%m%d).db
```

### Häufige Probleme

**Container startet nicht / Healthcheck fehlschlägt:**
```bash
docker compose logs app  # Fehler prüfen
docker compose down && docker compose up -d  # Neustart
```

**"AADSTS700016: Application not found":**
- Client ID und Tenant ID in `.env` prüfen
- NEXT_PUBLIC_* Variablen stimmen? (Erfordert Rebuild: `docker compose up -d --build`)

**"Insufficient privileges":**
- Admin Consent erteilen: Azure Portal → App-Registrierung → API-Berechtigungen → Administratorzustimmung erteilen

**CORS-Fehler:**
- `ALLOWED_ORIGINS` in `.env` prüfen (muss die Domain des Add-Ins enthalten)
- Container neu starten: `docker compose restart app`

**Add-In lädt nicht:**
- HTTPS erforderlich - HTTP funktioniert nicht
- Browser-Konsole (F12) auf Fehler prüfen
- Manifest-URLs müssen zur tatsächlichen Domain passen

**Datenbank-Fehler / better-sqlite3:**
- Volume-Berechtigungen prüfen: `docker compose exec app ls -la /data/`
- Rebuild erzwingen: `docker compose build --no-cache app`

---

## Versionsübersicht Outlook

| Outlook Version | XML Manifest | Unified Manifest | Auto-Insert |
|-----------------|--------------|------------------|-------------|
| Outlook New (Windows) | Eingeschränkt | Voll | Ja |
| Outlook Classic (Windows) | Ja | Ja | Je nach Version |
| Outlook Mac | Ja | Ja | Je nach Version |
| Outlook Web | Ja | Ja | Ja |
| Outlook Mobile | Ja | Ja | Nein |
