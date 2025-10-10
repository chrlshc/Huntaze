'use client';
import { useState } from 'react';

export default function PutCookiesPage() {
  const [text, setText] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const cookies = JSON.parse(text);
      const res = await fetch('/api/of/sessions/cookies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cookies }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed');
      setMsg('✅ Cookies déposés');
    } catch (err: any) {
      setMsg('❌ ' + (err?.message || 'Erreur'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h2>Déposer des cookies OnlyFans</h2>
      <p>
        Collez ici l’array JSON de cookies Playwright pour <code>onlyfans.com</code>.
      </p>
      <form onSubmit={onSubmit}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} style={{ width: '100%' }} />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Déposer'}
          </button>
        </div>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

