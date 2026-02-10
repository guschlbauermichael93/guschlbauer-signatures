import { AzureADUser } from '@guschlbauer/shared';

/**
 * Mock-Daten für lokale Entwicklung ohne Azure AD
 */

export const MOCK_USERS: AzureADUser[] = [
  {
    id: 'mock-1',
    displayName: 'Max Mustermann',
    givenName: 'Max',
    surname: 'Mustermann',
    mail: 'max.mustermann@guschlbauer.at',
    jobTitle: 'Geschäftsführer',
    department: 'Geschäftsleitung',
    mobilePhone: '+43 664 123 4567',
    businessPhones: ['+43 7242 51234-10'],
    officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
    companyName: 'Guschlbauer Backwaren GmbH',
  },
  {
    id: 'mock-2',
    displayName: 'Anna Bäcker',
    givenName: 'Anna',
    surname: 'Bäcker',
    mail: 'anna.baecker@guschlbauer.at',
    jobTitle: 'Produktionsleiterin',
    department: 'Produktion',
    mobilePhone: '+43 664 234 5678',
    businessPhones: ['+43 7242 51234-20'],
    officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
    companyName: 'Guschlbauer Backwaren GmbH',
  },
  {
    id: 'mock-3',
    displayName: 'Peter Mehl',
    givenName: 'Peter',
    surname: 'Mehl',
    mail: 'peter.mehl@guschlbauer.at',
    jobTitle: 'Vertriebsleiter',
    department: 'Vertrieb',
    mobilePhone: '+43 664 345 6789',
    businessPhones: ['+43 7242 51234-30'],
    officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
    companyName: 'Guschlbauer Backwaren GmbH',
  },
  {
    id: 'mock-4',
    displayName: 'Maria Korn',
    givenName: 'Maria',
    surname: 'Korn',
    mail: 'maria.korn@guschlbauer.at',
    jobTitle: 'Buchhaltung',
    department: 'Finanzen',
    mobilePhone: '+43 664 456 7890',
    businessPhones: ['+43 7242 51234-40'],
    officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
    companyName: 'Guschlbauer Backwaren GmbH',
  },
  {
    id: 'mock-5',
    displayName: 'Thomas Teig',
    givenName: 'Thomas',
    surname: 'Teig',
    mail: 'thomas.teig@guschlbauer.at',
    jobTitle: 'Bäckermeister',
    department: 'Produktion',
    mobilePhone: '+43 664 567 8901',
    businessPhones: ['+43 7242 51234-21'],
    officeLocation: 'Grieskirchner Straße 1, 4701 Bad Schallerbach',
    companyName: 'Guschlbauer Backwaren GmbH',
  },
];

export function getMockUser(email: string): AzureADUser | null {
  return MOCK_USERS.find(u => u.mail.toLowerCase() === email.toLowerCase()) || null;
}

export function getMockUserById(id: string): AzureADUser | null {
  return MOCK_USERS.find(u => u.id === id) || null;
}

/**
 * Erstellt einen Mock-User aus einer Email-Adresse
 */
export function createMockUserFromEmail(email: string): AzureADUser {
  const namePart = email.split('@')[0];
  const [firstName, lastName] = namePart.split('.').map(
    s => s.charAt(0).toUpperCase() + s.slice(1)
  );
  
  return {
    id: `mock-${Date.now()}`,
    displayName: `${firstName || 'Test'} ${lastName || 'User'}`,
    givenName: firstName || 'Test',
    surname: lastName || 'User',
    mail: email,
    jobTitle: 'Mitarbeiter',
    department: 'Allgemein',
    companyName: 'Guschlbauer Backwaren GmbH',
  };
}
