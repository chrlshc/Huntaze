'use client';

import { useState } from 'react';

export default function DebugLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function startLogin() {
    setBusy(true);
    setStatus('LOGIN_STARTED…');
    try {
      const res = await fetch('/api/of/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp: otp || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setStatus(`Failed: ${j?.error || res.status}`);
        return;
      }
      // Poll status a few times
      for (let i = 0; i < 15; i++) {
        const s = await fetch('/api/of/connect/status', { cache: 'no-store' });
        const j = await s.json();
        setStatus(j?.state || 'PENDING');
        if (['CONNECTED', 'FAILED', 'OTP_REQUIRED', 'FACEID_REQUIRED'].includes(j?.state)) break;
        await new Promise(r => setTimeout(r, 2000));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900">Server‑managed login (debug)</h2>
      <p className="mt-1 text-sm text-gray-600">Start a server‑side login using your OnlyFans credentials. If OTP is required, include it.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="rounded-md border px-3 py-2 text-sm" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="OTP (optional)" value={otp} onChange={e=>setOtp(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={startLogin} disabled={busy} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50">
          {busy ? 'Starting…' : 'Start server login'}
        </button>
        <span className="text-xs text-gray-500">Status: {status || '—'}</span>
      </div>
    </div>
  );
}

