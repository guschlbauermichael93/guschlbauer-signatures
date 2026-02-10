import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './taskpane.css';

interface SignatureTemplate {
  id: string;
  name: string;
  isDefault: boolean;
}

const API_BASE_URL = process.env.API_URL || 'https://signatures.guschlbauer.cc/api';

// SSO Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const token = await Office.auth.getAccessTokenAsync({
      allowSignInPrompt: true,
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

function App() {
  const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Office.js initialisieren
    Office.onReady(async (info) => {
      if (info.host === Office.HostType.Outlook) {
        // User-Info laden
        const profile = Office.context.mailbox.userProfile;
        setUserName(profile.displayName || profile.emailAddress);
        
        // Templates laden
        await loadTemplates();
      }
    });
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        headers: await getAuthHeaders(),
      });
      const data = await response.json();
      setTemplates(data.items || []);
      
      // Default Template auswählen
      const defaultTemplate = data.items?.find((t: SignatureTemplate) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSignature = async () => {
    setStatus('idle');
    
    try {
      const email = Office.context.mailbox.userProfile.emailAddress;
      const response = await fetch(
        `${API_BASE_URL}/signature?email=${encodeURIComponent(email)}&templateId=${selectedTemplate}&embed=url`,
        { headers: await getAuthHeaders() }
      );
      
      if (!response.ok) throw new Error('API Error');
      
      const { html } = await response.json();
      
      // In Mail einfügen
      Office.context.mailbox.item?.body.setSelectedDataAsync(
        html,
        { coercionType: Office.CoercionType.Html },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
          } else {
            setStatus('error');
          }
        }
      );
    } catch (error) {
      console.error('Fehler:', error);
      setStatus('error');
    }
  };

  const handleRefreshCache = async () => {
    setLoading(true);
    // Cache invalidieren
    localStorage.removeItem('signature-cache');
    await loadTemplates();
  };

  if (loading) {
    return (
      <div className="taskpane">
        <div className="loading">
          <div className="spinner"></div>
          <p>Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="taskpane">
      {/* Header */}
      <header className="header">
        <div className="logo">G</div>
        <div className="header-text">
          <h1>Guschlbauer Signatur</h1>
          <p>Hallo, {userName}</p>
        </div>
      </header>

      {/* Content */}
      <main className="content">
        {/* Template Auswahl */}
        <section className="section">
          <label className="label">Signatur-Vorlage</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="select"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.isDefault ? '(Standard)' : ''}
              </option>
            ))}
          </select>
        </section>

        {/* Insert Button */}
        <section className="section">
          <button
            onClick={handleInsertSignature}
            className="button primary"
          >
            Signatur einfügen
          </button>
          
          {status === 'success' && (
            <div className="status success">
              ✓ Signatur eingefügt
            </div>
          )}
          
          {status === 'error' && (
            <div className="status error">
              ✗ Fehler beim Einfügen
            </div>
          )}
        </section>

        {/* Info */}
        <section className="section info">
          <p>
            Die Signatur wird automatisch mit Ihren Daten aus dem 
            Unternehmensverzeichnis befüllt.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <button onClick={handleRefreshCache} className="button secondary">
          Daten aktualisieren
        </button>
        <a 
          href="https://signatures.guschlbauer.cc" 
          target="_blank" 
          rel="noopener noreferrer"
          className="link"
        >
          Admin-Bereich öffnen
        </a>
      </footer>
    </div>
  );
}

// React rendern wenn DOM bereit
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
