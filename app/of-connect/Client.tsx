'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type LinkState = 'PENDING' | 'LOGIN_STARTED' | 'OTP_REQUIRED' | 'FACEID_REQUIRED' | 'CONNECTED' | 'FAILED';
type Status = { state: LinkState; updatedAt?: string; errorCode?: string } | null;

export default function Client() {
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let mounted = true;
    async function tick() {
      try {
        const res = await fetch('/api/of/connect/status', { cache: 'no-store' });
        if (!res.ok) throw new Error('status');
        const j = await res.json();
        if (mounted) {
          setStatus(j);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Connect OnlyFans</h1>
      <p className="mt-2 text-sm text-gray-600">
        Recommended: open OnlyFans in your browser. Our extension will securely sync your session to Huntaze.
      </p>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Connection status</h2>
          <span className="text-xs text-gray-500">
            {loading ? 'Checking…' : status?.state ? status.state : 'Waiting…'}
            {status?.updatedAt ? ` • ${new Date(status.updatedAt).toLocaleTimeString()}` : ''}
          </span>
        </div>
        <h2 className="text-lg font-medium text-gray-900">Managed login (server)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Start a secure server‑side login. If OnlyFans requires OTP or Face ID, we’ll show it here.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              await fetch('/api/of/login/retry', { method: 'POST', headers: { 'content-type': 'application/json' } }).catch(()=>{});
              setLoading(false);
            }}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            {loading ? 'Retrying…' : 'Retry (ECS)'}
          </button>
        </div>
        {status?.state === 'OTP_REQUIRED' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
            OTP required — enter it and retry.
          </div>
        )}
        {status?.state === 'FACEID_REQUIRED' && (
          <div className="mt-3 text-sm text-amber-700">
            Face ID re‑verification required in OnlyFans. Complete it in your OF tab, then click Retry.
          </div>
        )}
      </section>
      
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Manual cookie upload (optional)</h2>
        <p className="mt-1 text-sm text-gray-600">Upload a Playwright cookie array for <code>onlyfans.com</code> if you already have one.</p>
        <div className="mt-3">
          <Link href="/of-connect/cookies" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">Go to cookie upload →</Link>
        </div>
      </section>
    </div>
  );
}
