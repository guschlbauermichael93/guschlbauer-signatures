import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { AzureADUser } from '@guschlbauer/shared';

/**
 * Microsoft Graph API Client
 * Für Zugriff auf Azure AD User-Daten
 */

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const tenantId = process.env.AZURE_AD_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure AD credentials not configured');
    }

    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }
  return msalClient;
}

export async function getGraphClient(): Promise<Client> {
  const msal = getMsalClient();
  
  const result = await msal.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result?.accessToken) {
    throw new Error('Failed to acquire access token');
  }

  return Client.init({
    authProvider: (done) => {
      done(null, result.accessToken);
    },
  });
}

export async function getUser(emailOrId: string): Promise<AzureADUser> {
  const client = await getGraphClient();
  
  const user = await client
    .api(`/users/${emailOrId}`)
    .select('id,displayName,givenName,surname,mail,jobTitle,department,mobilePhone,businessPhones,officeLocation,companyName')
    .get();

  return {
    id: user.id,
    displayName: user.displayName,
    givenName: user.givenName,
    surname: user.surname,
    mail: user.mail || emailOrId,
    jobTitle: user.jobTitle,
    department: user.department,
    mobilePhone: user.mobilePhone,
    businessPhones: user.businessPhones,
    officeLocation: user.officeLocation,
    companyName: user.companyName || 'Guschlbauer Backwaren GmbH',
  };
}

export async function getAllUsers(top: number = 100): Promise<AzureADUser[]> {
  const client = await getGraphClient();
  
  const response = await client
    .api('/users')
    .select('id,displayName,givenName,surname,mail,jobTitle,department,mobilePhone,businessPhones,officeLocation')
    .top(top)
    .orderby('displayName')
    .get();

  return response.value.map((user: Record<string, unknown>) => ({
    id: user.id as string,
    displayName: user.displayName as string,
    givenName: user.givenName as string | undefined,
    surname: user.surname as string | undefined,
    mail: user.mail as string,
    jobTitle: user.jobTitle as string | undefined,
    department: user.department as string | undefined,
    mobilePhone: user.mobilePhone as string | undefined,
    businessPhones: user.businessPhones as string[] | undefined,
    officeLocation: user.officeLocation as string | undefined,
  }));
}

/**
 * Prüft ob Azure AD konfiguriert ist
 */
export function isAzureADConfigured(): boolean {
  return !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  );
}
