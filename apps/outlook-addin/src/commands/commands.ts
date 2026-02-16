/*
 * Outlook Add-In Commands
 * Diese Funktionen werden direkt aus dem Ribbon aufgerufen
 */

import { renderTemplate, AzureADUser } from '@guschlbauer/shared';

// API Endpoint (wird beim Build ersetzt)
const API_BASE_URL = process.env.API_URL || 'https://signatures.guschlbauer.cc/api';

// SSO Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    if (!Office.auth?.getAccessTokenAsync) {
      return null;
    }
    const token = await new Promise<string>((resolve, reject) => {
      Office.auth.getAccessTokenAsync(
        { allowSignInPrompt: true },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve(result.value);
          } else {
            reject(result.error);
          }
        }
      );
    });
    cachedToken = token;
    tokenExpiry = Date.now() + 4 * 60 * 1000; // 4 Min Cache
    return token;
  } catch (error) {
    console.warn('SSO Token Fehler:', error);
    cachedToken = null;
    return null;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

interface SignatureAttachment {
  id: string;
  filename: string;
  mimeType: string;
  base64: string;
}

interface SignatureResponse {
  html: string;
  attachments?: SignatureAttachment[];
}

// Cache
let cachedSignature: SignatureResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

// Aktueller Signatur-Typ (um unnötige Wechsel zu vermeiden)
let currentSignatureType: 'full' | 'short' | null = null;

// Ob der E-Mail-Thread bereits eine Guschlbauer-Signatur enthält (wird einmal beim Compose-Start geprüft)
let threadHasSignature: boolean = false;

/**
 * Holt die gerenderte Signatur vom Server (CID-Modus mit Inline-Attachments)
 */
async function fetchSignature(): Promise<SignatureResponse> {
  if (cachedSignature && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSignature;
  }

  try {
    const userEmail = Office.context.mailbox.userProfile.emailAddress;

    const response = await fetch(`${API_BASE_URL}/signature?email=${encodeURIComponent(userEmail)}&embed=cid`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    cachedSignature = { html: data.html, attachments: data.attachments || [] };
    cacheTimestamp = Date.now();

    return cachedSignature;
  } catch (error) {
    console.error('Fehler beim Laden der Signatur:', error);
    return { html: getFallbackSignature(), attachments: [] };
  }
}

/**
 * Fallback-Signatur wenn API nicht erreichbar
 */
function getFallbackSignature(): string {
  const profile = Office.context.mailbox.userProfile;
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <tr>
        <td>
          <p style="margin: 0; font-weight: bold;">${profile.displayName || 'Mitarbeiter'}</p>
          <p style="margin: 5px 0 0 0; color: #666;">Guschlbauer Backwaren GmbH</p>
          <p style="margin: 5px 0 0 0;">${profile.emailAddress}</p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Fügt ein Bild als Inline-Attachment hinzu
 */
function addInlineAttachment(attachment: SignatureAttachment): Promise<void> {
  return new Promise((resolve, reject) => {
    const item = Office.context.mailbox.item;
    if (!item) { reject(new Error('No mail item')); return; }

    // addFileAttachmentFromBase64Async (Mailbox 1.8+)
    if ((item as any).addFileAttachmentFromBase64Async) {
      (item as any).addFileAttachmentFromBase64Async(
        attachment.base64,
        attachment.filename,
        { isInline: true, asyncContext: attachment.id },
        (result: Office.AsyncResult<string>) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            console.warn(`Inline-Attachment ${attachment.id} fehlgeschlagen:`, result.error);
            resolve(); // Nicht abbrechen, Signatur trotzdem setzen
          }
        }
      );
    } else {
      // Fallback: Attachment via URL
      const url = `${API_BASE_URL.replace('/api', '')}/api/assets/serve?id=${attachment.id}`;
      item.addFileAttachmentAsync(
        url,
        attachment.filename,
        { isInline: true, asyncContext: attachment.id },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            console.warn(`Inline-Attachment ${attachment.id} (URL) fehlgeschlagen:`, result.error);
            resolve();
          }
        }
      );
    }
  });
}

/**
 * Setzt die Signatur via setSignatureAsync (Mailbox 1.10+)
 * Platziert Signatur am Ende, Cursor bleibt oben.
 * Fallback auf body.setAsync für ältere Clients.
 */
async function insertSignatureAtEnd(signatureData: SignatureResponse): Promise<void> {
  // 1. Inline-Attachments hinzufügen (Bilder)
  if (signatureData.attachments && signatureData.attachments.length > 0) {
    await Promise.all(signatureData.attachments.map(att => addInlineAttachment(att)));
  }

  const signature = signatureData.html;
  const item = Office.context.mailbox.item;
  if (!item) return;

  // 2. setSignatureAsync verwenden (Mailbox 1.10+) - Cursor bleibt oben
  if ((item.body as any).setSignatureAsync) {
    return new Promise((resolve, reject) => {
      (item.body as any).setSignatureAsync(
        signature,
        { coercionType: Office.CoercionType.Html },
        (result: Office.AsyncResult<void>) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            resolve();
          } else {
            console.warn('setSignatureAsync fehlgeschlagen, Fallback auf setAsync:', result.error);
            insertSignatureFallback(item, signature).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  // Fallback für ältere Clients
  return insertSignatureFallback(item, signature);
}

/**
 * Fallback: Signatur via body.setAsync einfügen
 */
function insertSignatureFallback(item: Office.MessageCompose, signature: string): Promise<void> {
  return new Promise((resolve, reject) => {
    item.body.getAsync(
      Office.CoercionType.Html,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error?.message || 'Fehler beim Lesen des Mail-Bodys'));
          return;
        }

        const currentBody = result.value || '';

        if (currentBody.includes('<!-- guschlbauer-signature -->')) {
          const newBody = currentBody.replace(
            /<!-- guschlbauer-signature -->[\s\S]*<!-- \/guschlbauer-signature -->/,
            `<!-- guschlbauer-signature -->\n${signature}\n<!-- /guschlbauer-signature -->`
          );
          item.body.setAsync(newBody, { coercionType: Office.CoercionType.Html }, (r) => {
            r.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(new Error(r.error?.message));
          });
        } else {
          const signatureHtml = `<br><br><!-- guschlbauer-signature -->\n${signature}\n<!-- /guschlbauer-signature -->`;
          item.body.setAsync(currentBody + signatureHtml, { coercionType: Office.CoercionType.Html }, (r) => {
            r.status === Office.AsyncResultStatus.Succeeded ? resolve() : reject(new Error(r.error?.message));
          });
        }
      }
    );
  });
}

/**
 * Prüft ob die vollständige Signatur bereits im E-Mail-Body vorhanden ist.
 * Erkennung über:
 * 1. HTML-Kommentar <!-- gsig --> (primär)
 * 2. Legacy-Kommentar <!-- guschlbauer-signature --> (Fallback)
 * 3. Firmenname "Guschlbauer Backwaren" im Body (Content-Fallback)
 */
function hasExistingSignature(): Promise<boolean> {
  return new Promise((resolve) => {
    const item = Office.context.mailbox.item;
    if (!item) { resolve(false); return; }

    item.body.getAsync(Office.CoercionType.Html, (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded || !result.value) {
        resolve(false);
        return;
      }
      const body = result.value;
      resolve(
        body.includes('<!-- gsig -->') ||
        body.includes('<!-- guschlbauer-signature -->') ||
        body.includes('Guschlbauer Backwaren')
      );
    });
  });
}

// Cache für Reply-Signatur
let cachedReplySignature: SignatureResponse | null = null;
let replyCacheTimestamp: number = 0;

/**
 * Holt die Antwort-Signatur vom Server (mit Platzhalter-Ersetzung).
 * Fallback auf einfache Grußformel wenn API nicht erreichbar.
 */
async function fetchReplySignature(): Promise<SignatureResponse> {
  if (cachedReplySignature && Date.now() - replyCacheTimestamp < CACHE_DURATION) {
    return cachedReplySignature;
  }

  try {
    const userEmail = Office.context.mailbox.userProfile.emailAddress;
    const response = await fetch(`${API_BASE_URL}/signature?email=${encodeURIComponent(userEmail)}&type=reply`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    cachedReplySignature = { html: data.html, attachments: data.attachments || [] };
    replyCacheTimestamp = Date.now();
    return cachedReplySignature;
  } catch (error) {
    console.error('Fehler beim Laden der Antwort-Signatur:', error);
    // Fallback: einfache Grußformel
    const profile = Office.context.mailbox.userProfile;
    const name = profile.displayName || 'Mitarbeiter';
    return {
      html: `<p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; margin: 0;">Freundliche Gr&uuml;&szlig;e<br><strong>${name}</strong></p>`,
      attachments: [],
    };
  }
}

/**
 * Prüft ob ALLE Empfänger (To) intern sind (@guschlbauer.*)
 */
function isInternalOnly(): Promise<boolean> {
  return new Promise((resolve) => {
    const item = Office.context.mailbox.item;
    if (!item) { resolve(false); return; }

    item.to.getAsync((result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded || !result.value) {
        resolve(false);
        return;
      }

      const recipients = result.value as Office.EmailAddressDetails[];
      if (recipients.length === 0) {
        // Keine Empfänger -> kann nicht beurteilt werden, volle Signatur
        resolve(false);
        return;
      }

      const allInternal = recipients.every((r) => {
        const email = (r.emailAddress || '').toLowerCase();
        return email.endsWith('@guschlbauer.at') || email.endsWith('@guschlbauer.cc');
      });
      resolve(allInternal);
    });
  });
}

/**
 * Wählt die passende Signatur basierend auf Kontext (Auto-Insert):
 * - Nur interne Empfänger → immer kurze Signatur
 * - Externe Empfänger + Signatur schon im Thread → kurze Signatur
 * - Externe Empfänger + keine Signatur im Thread → volle Signatur
 *
 * WICHTIG: threadHasSignature muss VOR dem Aufruf gesetzt werden,
 * da nach dem Einfügen unserer eigenen Signatur die Body-Prüfung
 * immer positiv wäre (false positive).
 */
async function getSignatureForContext(): Promise<{ data: SignatureResponse; type: 'short' | 'full' }> {
  const internal = await isInternalOnly();
  if (internal || threadHasSignature) {
    return { data: await fetchReplySignature(), type: 'short' };
  }
  return { data: await fetchSignature(), type: 'full' };
}

/**
 * LaunchEvent Handler: Wird von Outlook aufgerufen wenn sich Empfänger ändern.
 * Deklariert im Manifest als OnMessageRecipientsChanged.
 * Intern → immer kurze Signatur
 * Extern + Thread hat Signatur → kurze Signatur
 * Extern + Thread hat keine Signatur → volle Signatur
 *
 * Verwendet threadHasSignature (einmal beim Compose-Start ermittelt),
 * NICHT hasExistingSignature() live, da unsere eigene Signatur
 * sonst als false positive erkannt wird.
 */
async function onMessageRecipientsChanged(event: Office.AddinCommands.Event): Promise<void> {
  try {
    const internal = await isInternalOnly();

    // Zieltyp bestimmen
    let targetType: 'short' | 'full';
    if (internal || threadHasSignature) {
      targetType = 'short';
    } else {
      targetType = 'full';
    }

    // Nur wechseln wenn sich der Typ tatsächlich ändert
    if (targetType === currentSignatureType) {
      event.completed();
      return;
    }

    const signatureData = targetType === 'short' ? await fetchReplySignature() : await fetchSignature();
    await insertSignatureAtEnd(signatureData);
    currentSignatureType = targetType;
  } catch (error) {
    console.error('Signatur-Wechsel bei Empfängeränderung fehlgeschlagen:', error);
  }

  event.completed();
}

/**
 * Command: Signatur manuell einfügen (Button-Klick)
 * Prüft Empfänger: intern → kurze Grußformel, extern → volle Signatur
 */
async function insertSignature(event: Office.AddinCommands.Event): Promise<void> {
  try {
    const internal = await isInternalOnly();
    const signatureData = internal ? await fetchReplySignature() : await fetchSignature();
    await insertSignatureAtEnd(signatureData);
    currentSignatureType = internal ? 'short' : 'full';

    Office.context.mailbox.item?.notificationMessages.addAsync(
      'signature-success',
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
        message: 'Signatur erfolgreich eingefügt',
        icon: 'icon-16',
        persistent: false,
      }
    );
  } catch (error) {
    console.error('Fehler beim Einfügen der Signatur:', error);

    Office.context.mailbox.item?.notificationMessages.addAsync(
      'signature-error',
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage,
        message: 'Signatur konnte nicht eingefügt werden',
      }
    );
  }

  event.completed();
}

/**
 * Event Handler: Bei neuer Mail automatisch Signatur einfügen.
 * Empfänger-Wechsel wird über separates LaunchEvent (OnMessageRecipientsChanged) gehandelt.
 *
 * WICHTIG: threadHasSignature wird VOR dem Einfügen geprüft,
 * damit unsere eigene Signatur nicht als false positive zählt.
 */
async function onNewMessageCompose(event: Office.AddinCommands.Event): Promise<void> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Thread-Signatur VOR dem Einfügen prüfen (bei Antworten enthält der Body die Vorgänger-Mail)
    threadHasSignature = await hasExistingSignature();

    const result = await getSignatureForContext();
    await insertSignatureAtEnd(result.data);
    currentSignatureType = result.type;
  } catch (error) {
    console.error('Auto-Signatur Fehler:', error);
  }

  event.completed();
}

// Office.js initialisieren
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    console.log('Guschlbauer Signatur Add-In geladen');

    if (Office.actions) {
      Office.actions.associate('insertSignature', insertSignature);
      Office.actions.associate('onNewMessageComposeHandler', onNewMessageCompose);
      Office.actions.associate('onMessageRecipientsChangedHandler', onMessageRecipientsChanged);
    }
  }
});

// Funktionen auch global verfügbar machen (Fallback für altes Manifest)
(window as any).insertSignature = insertSignature;
(window as any).onNewMessageCompose = onNewMessageCompose;
(window as any).onNewMessageComposeHandler = onNewMessageCompose;
(window as any).onMessageRecipientsChanged = onMessageRecipientsChanged;
(window as any).onMessageRecipientsChangedHandler = onMessageRecipientsChanged;
