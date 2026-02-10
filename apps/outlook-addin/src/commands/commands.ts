/*
 * Outlook Add-In Commands
 * Diese Funktionen werden direkt aus dem Ribbon aufgerufen
 */

import { renderTemplate, AzureADUser } from '@guschlbauer/shared';

// API Endpoint und Key (werden beim Build ersetzt)
const API_BASE_URL = process.env.API_URL || 'https://signatures.guschlbauer.cc/api';
const API_KEY = process.env.API_KEY || '';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers['Authorization'] = `ApiKey ${API_KEY}`;
  }
  return headers;
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
      headers: getAuthHeaders(),
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
 * Fügt die Signatur am Ende des Mail-Bodys ein
 */
async function insertSignatureAtEnd(signatureData: SignatureResponse): Promise<void> {
  // 1. Inline-Attachments hinzufügen (Bilder)
  if (signatureData.attachments && signatureData.attachments.length > 0) {
    await Promise.all(signatureData.attachments.map(att => addInlineAttachment(att)));
  }

  // 2. HTML-Body setzen
  return new Promise((resolve, reject) => {
    Office.context.mailbox.item?.body.getAsync(
      Office.CoercionType.Html,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error?.message || 'Fehler beim Lesen des Mail-Bodys'));
          return;
        }

        const currentBody = result.value || '';
        const signature = signatureData.html;

        // Prüfen ob schon eine Signatur vorhanden ist
        if (currentBody.includes('<!-- guschlbauer-signature -->')) {
          const newBody = currentBody.replace(
            /<!-- guschlbauer-signature -->[\s\S]*<!-- \/guschlbauer-signature -->/,
            `<!-- guschlbauer-signature -->\n${signature}\n<!-- /guschlbauer-signature -->`
          );

          Office.context.mailbox.item?.body.setAsync(
            newBody,
            { coercionType: Office.CoercionType.Html },
            (setResult) => {
              if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                resolve();
              } else {
                reject(new Error(setResult.error?.message || 'Fehler beim Setzen der Signatur'));
              }
            }
          );
        } else {
          const signatureHtml = `
            <br><br>
            <!-- guschlbauer-signature -->
            ${signature}
            <!-- /guschlbauer-signature -->
          `;

          Office.context.mailbox.item?.body.setAsync(
            currentBody + signatureHtml,
            { coercionType: Office.CoercionType.Html },
            (setResult) => {
              if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                resolve();
              } else {
                reject(new Error(setResult.error?.message || 'Fehler beim Setzen der Signatur'));
              }
            }
          );
        }
      }
    );
  });
}

/**
 * Command: Signatur manuell einfügen (Button-Klick)
 */
async function insertSignature(event: Office.AddinCommands.Event): Promise<void> {
  try {
    const signatureData = await fetchSignature();
    await insertSignatureAtEnd(signatureData);

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
 * Event Handler: Bei neuer Mail automatisch Signatur einfügen
 */
async function onNewMessageCompose(event: Office.AddinCommands.Event): Promise<void> {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const signatureData = await fetchSignature();
    await insertSignatureAtEnd(signatureData);
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
    }
  }
});

// Funktionen auch global verfügbar machen (Fallback für altes Manifest)
(window as any).insertSignature = insertSignature;
(window as any).onNewMessageCompose = onNewMessageCompose;
(window as any).onNewMessageComposeHandler = onNewMessageCompose;
