"use client";

import { useEffect, useMemo, useState } from "react";

export default function ConnectOfLanding() {
  const [opened, setOpened] = useState(false);
  const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const token = params.get('token') || '';
  const user = params.get('user') || '';

  const deepLink = useMemo(() => {
    try {
      const u = new URL('huntaze://connect', 'http://dummy');
      if (token) u.searchParams.set('token', token);
      if (user) u.searchParams.set('user', user);
      return u.toString().replace('http://dummy', '');
    } catch {
      return '';
    }
  }, [token, user]);

  useEffect(() => {
    // Only attempt auto deep-link on iOS when running as an installed PWA.
    // On desktop/corporate environments, custom schemes may be blocked and show an interstitial.
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && (navigator as any).platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
      const isStandalone = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
      );
      if (!(isIOS && isStandalone)) return;
    } catch {
      // If detection fails, skip auto open
      return;
    }

    const t = setTimeout(() => {
      if (deepLink) {
        try { window.location.href = deepLink; setOpened(true); } catch {}
      }
    }, 300);
    return () => clearTimeout(t);
  }, [deepLink]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Prevent indexing to avoid leaking tokens in URLs */}
      <meta name="robots" content="noindex,nofollow" />
      <section className="mx-auto max-w-xl px-4 pb-16 pt-12">
        <h1 className="text-xl font-semibold text-slate-900">Huntaze Connect</h1>
        <p className="mt-1 text-slate-600">
          If the app didn’t open automatically, use the button below to continue. This page carries your short‑lived token.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-700">Token</div>
          <code className="mt-1 block truncate rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-900">
            {token ? `${token.slice(0, 6)}…${token.slice(-6)}` : '—'}
          </code>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={deepLink} className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">Open in app</a>
            <a href="/of-connect" className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Continue on web</a>
            {!opened && <span className="text-xs text-slate-500">If nothing happens, install the app then try again.</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
