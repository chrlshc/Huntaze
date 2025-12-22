'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { EmptyState } from '@/components/ui/EmptyState';

export default function PutCookiesPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-6">
        <EmptyState
          variant="no-data"
          title="Not available"
          description="This developer utility is disabled in production."
        />
      </div>
    );
  }

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
      setMsg('✅ Cookies saved');
    } catch (err: any) {
      setMsg('❌ ' + (err?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h2>Save OnlyFans cookies</h2>
      <p>
        Paste the Playwright cookies JSON array for <code>onlyfans.com</code> here.
      </p>
      <form onSubmit={onSubmit}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} style={{ width: '100%' }} />
        <div style={{ marginTop: 12 }}>
          <Button variant="primary" disabled={loading} type="submit">
  {loading ? 'Sending…' : 'Save'}
</Button>
        </div>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
