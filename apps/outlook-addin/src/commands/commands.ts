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

// Cache für Signatur (vermeidet wiederholte API-Calls)
let cachedSignature: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

/**
 * Holt die gerenderte Signatur vom Server
 */
async function fetchSignature(): Promise<string> {
  // Cache prüfen
  if (cachedSignature && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSignature;
  }

  try {
    // User-Email aus Outlook holen
    const userEmail = Office.context.mailbox.userProfile.emailAddress;
    
    // Signatur von API holen
    const response = await fetch(`${API_BASE_URL}/signature?email=${encodeURIComponent(userEmail)}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    cachedSignature = data.html;
    cacheTimestamp = Date.now();
    
    return cachedSignature;
  } catch (error) {
    console.error('Fehler beim Laden der Signatur:', error);
    // Fallback: Einfache Signatur
    return getFallbackSignature();
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
 * Fügt die Signatur am Ende des Mail-Bodys ein
 */
async function insertSignatureAtEnd(signature: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.mailbox.item?.body.getAsync(
      Office.CoercionType.Html,
      (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error?.message || 'Fehler beim Lesen des Mail-Bodys'));
          return;
        }

        const currentBody = result.value || '';
        
        // Prüfen ob schon eine Signatur vorhanden ist
        if (currentBody.includes('<!-- guschlbauer-signature -->')) {
          // Signatur ersetzen
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
          // Signatur am Ende einfügen
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
    const signature = await fetchSignature();
    await insertSignatureAtEnd(signature);
    
    // Erfolgs-Notification
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
    
    // Fehler-Notification
    Office.context.mailbox.item?.notificationMessages.addAsync(
      'signature-error',
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage,
        message: 'Signatur konnte nicht eingefügt werden',
      }
    );
  }
  
  // Event abschließen
  event.completed();
}

/**
 * Event Handler: Bei neuer Mail automatisch Signatur einfügen
 */
async function onNewMessageCompose(event: Office.AddinCommands.Event): Promise<void> {
  try {
    // Kurz warten bis Outlook bereit ist
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const signature = await fetchSignature();
    await insertSignatureAtEnd(signature);
  } catch (error) {
    console.error('Auto-Signatur Fehler:', error);
    // Kein Fehler anzeigen bei Auto-Insert
  }
  
  event.completed();
}

// Office.js initialisieren
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    console.log('Guschlbauer Signatur Add-In geladen');
    
    // Event Handler für Unified Manifest registrieren
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
