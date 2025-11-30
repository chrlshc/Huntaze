'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from '@/components/ui/card';

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
    <Card className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900">Connect OnlyFans</h2>
      <p className="mt-1 text-sm text-gray-600">Start a secure server‑side login using your OnlyFans credentials. If 2FA is enabled on your account, include the OTP.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Input placeholder="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
        <Input placeholder="OTP (optional)" value={otp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" onClick={startLogin} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect now'}
        </Button>
        <span className="text-xs text-gray-500">Status: {status || '—'}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Possible states: PENDING → LOGIN_STARTED → CONNECTED, or OTP_REQUIRED / FACEID_REQUIRED / FAILED.
      </div>
    </Card>
  );
}
