# Bedienungsanleitung - Guschlbauer Signatur Manager

## Inhaltsverzeichnis

1. [Einleitung](#1-einleitung)
2. [Anmeldung](#2-anmeldung)
3. [Dashboard](#3-dashboard)
4. [Vorlagen verwalten](#4-vorlagen-verwalten)
5. [Assets verwalten (Bilder & Logos)](#5-assets-verwalten-bilder--logos)
6. [Mitarbeiter & Zuweisungen](#6-mitarbeiter--zuweisungen)
7. [Outlook Add-In](#7-outlook-add-in)
8. [Häufige Fragen (FAQ)](#8-häufige-fragen-faq)

---

## 1. Einleitung

Der **Guschlbauer Signatur Manager** ist ein zentrales Verwaltungstool für E-Mail-Signaturen. Damit können Sie:

- Signatur-Vorlagen mit dem Firmenlogo und Kontaktdaten erstellen und bearbeiten
- Bilder (Logo, Banner etc.) verwalten und in Signaturen einbetten
- Mitarbeitern individuelle Signatur-Vorlagen zuweisen
- Signaturen automatisch in Outlook einfügen lassen (via Add-In)

Das Admin-Panel ist erreichbar unter: **https://signatures.guschlbauer.cc**

---

## 2. Anmeldung

### Mit Azure AD (Produktion)
1. Rufen Sie https://signatures.guschlbauer.cc auf
2. Klicken Sie auf **"Anmelden"** in der Kopfzeile
3. Melden Sie sich mit Ihrem Guschlbauer Microsoft-Konto an
4. Nach erfolgreicher Anmeldung sehen Sie Ihren Namen oben rechts

### Abmelden
- Klicken Sie auf Ihren Namen oben rechts und dann auf **"Abmelden"**

---

## 3. Dashboard

Nach der Anmeldung landen Sie auf dem Dashboard. Hier sehen Sie:

### Schnellstatistiken
Drei Kacheln zeigen Ihnen auf einen Blick:
- **Vorlagen**: Anzahl der aktiven Signatur-Vorlagen
- **Assets**: Anzahl der hochgeladenen Bilder/Logos
- **Zuweisungen**: Anzahl der individuellen Mitarbeiter-Zuweisungen

### Signatur-Vorlagen
Eine Tabelle aller Vorlagen mit:
- **Name** und Beschreibung
- **Status** (Aktiv/Inaktiv)
- **Zuletzt bearbeitet** (Datum)
- **Aktionen**: Bearbeiten und Löschen

### Navigation
Die Kopfzeile enthält vier Menüpunkte:
- **Dashboard** - Startseite mit Übersicht
- **Vorlagen** - Alle Signatur-Vorlagen verwalten
- **Mitarbeiter** - Mitarbeiterliste und Zuweisungen
- **Assets** - Bilder und Logos verwalten

---

## 4. Vorlagen verwalten

### 4.1 Vorlagen-Übersicht

Unter **Vorlagen** sehen Sie alle Signatur-Vorlagen. Jede Vorlage hat:
- Einen **Namen** (z.B. "Standard Signatur")
- Einen **Status** (grün = aktiv, grau = inaktiv)
- Ein **Standard-Badge**, falls die Vorlage als Standard definiert ist

### 4.2 Neue Vorlage erstellen

1. Klicken Sie auf **"Neue Vorlage"**
2. Füllen Sie das Formular aus:
   - **Name**: Ein eindeutiger Name (z.B. "Standard Signatur", "Vertrieb Signatur")
   - **Beschreibung**: Optionale kurze Beschreibung
   - **Als Standard festlegen**: Aktivieren, wenn diese Vorlage standardmäßig verwendet werden soll
3. Bearbeiten Sie das **HTML Template** im Editor (linke Seite). Der Editor hat zwei Tabs:
   - **Vollständige Signatur**: Die Hauptsignatur mit Logo, Kontaktdaten etc. (wird bei neuen E-Mails an externe Empfänger verwendet)
   - **Antwort-Signatur**: Eine kurze Grußformel (z.B. "Freundliche Grüße + Name"), die bei Antworten und internen E-Mails verwendet wird
4. Die **Vorschau** (rechte Seite) zeigt in Echtzeit, wie die Signatur aussehen wird
5. Klicken Sie auf **"Speichern"**

### 4.3 Vorlage bearbeiten

1. Klicken Sie in der Vorlagen-Tabelle auf **"Bearbeiten"** (Stift-Symbol)
2. Ändern Sie die gewünschten Felder (inkl. Antwort-Signatur über den zweiten Tab)
3. Die Vorschau aktualisiert sich live während Sie tippen
4. Klicken Sie auf **"Speichern"**

### 4.4 Vorlage löschen

1. Klicken Sie auf **"Löschen"** (Papierkorb-Symbol)
2. Bestätigen Sie den Löschvorgang im Dialog
3. Die Standard-Vorlage kann nicht gelöscht werden

### 4.5 Platzhalter verwenden

Im HTML-Template können Sie Platzhalter verwenden, die automatisch mit den Mitarbeiterdaten befüllt werden:

| Platzhalter | Beschreibung | Beispielwert |
|---|---|---|
| `{{displayName}}` | Vollständiger Name | Max Mustermann |
| `{{givenName}}` | Vorname | Max |
| `{{surname}}` | Nachname | Mustermann |
| `{{mail}}` | E-Mail-Adresse | max.mustermann@guschlbauer.at |
| `{{jobTitle}}` | Berufsbezeichnung | Geschäftsführer |
| `{{department}}` | Abteilung | Geschäftsleitung |
| `{{mobilePhone}}` | Mobiltelefon | +43 664 123 4567 |
| `{{businessPhones}}` | Festnetz | +43 7242 51234-10 |
| `{{officeLocation}}` | Standort/Adresse | Grieskirchner Straße 1, 4701 Bad Schallerbach |
| `{{companyName}}` | Firmenname | Guschlbauer Backwaren GmbH |

Zusätzlich können Sie Asset-Platzhalter verwenden (siehe Abschnitt 5):
- `{{logo}}` - Das Firmenlogo
- `{{banner}}`, `{{icon}}` etc. - Weitere hochgeladene Bilder

**Tipp**: Klicken Sie im Bereich "Verfügbare Platzhalter" auf einen Platzhalter, um ihn in die Zwischenablage zu kopieren.

### 4.6 Vorschau-Funktionen

Die Vorschau auf der rechten Seite bietet:

- **Mitarbeiter-Auswahl**: Wählen Sie im Dropdown einen Mitarbeiter aus, um die Signatur mit dessen Daten zu sehen
- **Desktop/Mobile**: Wechseln Sie zwischen Desktop- und Mobile-Ansicht (375px Breite)
- **Echte Bilder**: Die Vorschau zeigt die tatsächlichen Logos und Bilder aus der Datenbank

---

## 5. Assets verwalten (Bilder & Logos)

### 5.1 Firmenlogo

Das Firmenlogo wird in allen Signaturen über den Platzhalter `{{logo}}` eingebunden.

**Logo ersetzen:**
1. Gehen Sie zu **Assets**
2. Im Bereich "Firmenlogo" sehen Sie das aktuelle Logo
3. Klicken Sie auf **"Datei auswählen"** und wählen Sie ein neues Bild
4. Das Logo wird sofort ersetzt

**Unterstützte Formate**: PNG, JPEG, SVG, WebP (max. 500 KB)

### 5.2 Weitere Bilder hochladen

Sie können zusätzliche Bilder hochladen (z.B. Banner, Zertifikats-Logos, Social-Media-Icons):

1. Klicken Sie auf **"Hochladen"** im Bereich "Weitere Bilder"
2. Wählen Sie eine Bilddatei aus
3. Im Upload-Dialog:
   - **Name**: Beschreibender Name für das Bild
   - **Platzhalter-ID**: Eine kurze ID (z.B. `banner`, `ecovadis`). Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt. Diese ID verwenden Sie dann als `{{banner}}` im Template.
   - **HTML-Tag** (optional): Definieren Sie einen HTML-Tag mit `{{src}}` als Platzhalter für die Bild-URL. Beispiel:
     ```html
     <img src="{{src}}" alt="EcoVadis" width="600" style="max-width:100%; display:block;" />
     ```
4. Klicken Sie auf **"Hochladen"**

### 5.3 Bilder in Templates verwenden

Nach dem Hochladen erscheint neben jedem Bild ein Platzhalter-Badge (z.B. `{{banner}}`). Klicken Sie darauf, um ihn zu kopieren, und fügen Sie ihn in Ihr HTML-Template ein.

### 5.4 Bilder löschen

- Klicken Sie bei einem Bild auf **"Löschen"** und bestätigen Sie
- Das Firmenlogo (`{{logo}}`) kann nicht gelöscht werden

---

## 6. Mitarbeiter & Zuweisungen

### 6.1 Mitarbeiter-Übersicht

Unter **Mitarbeiter** sehen Sie eine Tabelle aller Mitarbeiter mit:
- **Name** und E-Mail-Adresse
- **Berufsbezeichnung** und Abteilung
- **Zugewiesene Signatur-Vorlage**

> **Hinweis**: Ohne Azure AD-Anbindung werden Demo-Daten angezeigt (erkennbar am gelben "Demo-Daten" Badge).

### 6.2 Vorlage zuweisen

Jeder Mitarbeiter kann eine individuelle Signatur-Vorlage erhalten:

1. Finden Sie den Mitarbeiter in der Tabelle
2. Wählen Sie im Dropdown **"Signatur-Vorlage"** die gewünschte Vorlage aus
3. Die Zuweisung wird sofort gespeichert

Mitarbeiter ohne individuelle Zuweisung erhalten automatisch die Standard-Vorlage.

### 6.3 Signatur-Vorschau

Um die fertige Signatur eines Mitarbeiters zu sehen:
1. Klicken Sie auf **"Vorschau"** in der Aktionen-Spalte
2. Ein Popup zeigt die gerenderte Signatur mit allen Daten des Mitarbeiters
3. Schließen Sie das Popup mit dem X-Button

---

## 7. Outlook Add-In

### 7.1 Was macht das Add-In?

Das Outlook Add-In fügt automatisch die personalisierte Signatur in E-Mails ein und wählt je nach Kontext die richtige Variante:

- **Neue E-Mail an externe Empfänger**: Volle Signatur mit Logo, Kontaktdaten und allen Details
- **E-Mail an interne Empfänger** (`@guschlbauer.at` / `@guschlbauer.cc`): Immer die kurze Antwort-Signatur (z.B. "Freundliche Grüße + Name")
- **Antwort/Weiterleitung** (wenn die volle Signatur bereits im E-Mail-Thread vorhanden ist): Kurze Antwort-Signatur

Die Antwort-Signatur wird im Admin-Panel pro Vorlage konfiguriert (siehe Abschnitt 4.2).

### 7.2 Ribbon-Button "Signatur einfügen"

Beim Verfassen einer E-Mail erscheint in der Outlook-Menüleiste die Gruppe **"Signatur"** mit zwei Buttons:

1. **"Signatur einfügen"**: Fügt die Signatur am Ende der E-Mail ein. Bei internen Empfängern wird die kurze Antwort-Signatur verwendet, bei externen die volle Signatur. Der Cursor bleibt am Anfang der Nachricht.
2. **"Einstellungen"**: Öffnet das Einstellungsfenster (Taskpane) zum Auswählen einer anderen Vorlage.

### 7.3 Einstellungsfenster (Taskpane)

Im Taskpane können Sie:
- Eine **andere Signatur-Vorlage** aus dem Dropdown auswählen
- Die Signatur über **"Signatur einfügen"** manuell einfügen
- Über **"Daten aktualisieren"** den Cache leeren und aktuelle Daten vom Server laden
- Über den Link den **Admin-Bereich** im Browser öffnen

### 7.4 Automatische Signatur

Wenn das Add-In mit LaunchEvent-Unterstützung installiert ist (Mailbox API 1.10+), wird die Signatur automatisch eingefügt:
- **Neue E-Mail an externe Empfänger**: Volle Signatur wird automatisch hinzugefügt
- **Interne Empfänger**: Immer die kurze Antwort-Signatur
- **Antwort/Weiterleitung**: Kurze Antwort-Signatur (die volle Signatur ist bereits im Thread sichtbar)

Wenn Sie Empfänger ändern (z.B. von extern auf intern), wird die Signatur automatisch gewechselt.

### 7.5 Bilder in der Signatur

Bilder werden als **CID-Inline-Attachments** eingebettet. Das bedeutet:
- Bilder sind direkt in der E-Mail enthalten (keine externen URLs)
- Empfänger sehen die Bilder sofort, ohne sie separat laden zu müssen
- Die Bilder bleiben auch sichtbar, wenn der Empfänger offline ist

---

## 8. Häufige Fragen (FAQ)

### Warum sehe ich "Demo-Daten"?
Azure Active Directory ist nicht konfiguriert. Die Mitarbeiterliste zeigt Beispiel-Daten. Kontaktieren Sie den Administrator.

### Kann ich mehrere Standard-Vorlagen haben?
Nein, es kann nur eine Vorlage als Standard markiert werden. Sie können aber jedem Mitarbeiter individuell eine andere Vorlage zuweisen.

### Was passiert, wenn ich eine Vorlage lösche?
Die Vorlage wird deaktiviert (Soft Delete). Mitarbeiter, die dieser Vorlage zugewiesen waren, erhalten dann automatisch die Standard-Vorlage.

### Wie groß dürfen Bilder sein?
Maximal 500 KB pro Bild. Unterstützte Formate: PNG, JPEG, GIF, SVG, WebP.

### Der "Signatur einfügen" Button erscheint nicht in Outlook
Das Add-In muss vom Microsoft 365 Administrator installiert werden. Alternativ kann es zum Testen sideloaded werden (siehe Technische Dokumentation).

### Die Signatur zeigt falsche/alte Daten
Klicken Sie im Outlook Add-In Taskpane auf **"Daten aktualisieren"**. Die Signaturen werden 5 Minuten im Cache gehalten.

### Kann ich HTML direkt schreiben?
Ja, der Template-Editor arbeitet mit rohem HTML. Für E-Mail-Kompatibilität sollten Sie Inline-Styles verwenden und auf moderne CSS-Features (Flexbox, Grid) verzichten. Tabellen-basierte Layouts funktionieren am zuverlässigsten.
