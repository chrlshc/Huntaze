"use client";

import React, { useEffect, useState } from "react";

type TokenResp = { ingestToken: string; userId: string; apiBase?: string };

async function fetchToken(): Promise<TokenResp> {
  const res = await fetch("/api/of/ingest-token", { method: "POST", credentials: 'include' as RequestCredentials });
  if (!res.ok) throw new Error("Unable to create ingest token");
  return res.json();
}

export function BridgeLauncher({ compact = false, variant = 'default' }: { compact?: boolean; variant?: 'default' | 'hz' }) {
  const [busy, setBusy] = useState<"ios" | "desktop" | "native" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/auth/status', { cache: 'no-store', credentials: 'include' as RequestCredentials });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        setAuthed(j?.authenticated === true);
      } catch {
        if (!alive) return;
        setAuthed(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleIos = async () => {
    setBusy("ios");
    setErr(null);
    try {
      if (authed === false) {
        throw new Error("Sign in required");
      }
      const { ingestToken, userId, apiBase } = await fetchToken();
      const base = apiBase || window.location.origin;
      const u = new URL("/connect-of", base);
      u.searchParams.set("token", ingestToken);
      u.searchParams.set("user", userId);
      // Universal Link – iOS will open the app if installed
      window.location.href = u.toString();
    } catch (e: any) {
      setErr(e?.message || "Failed to open iOS bridge");
    } finally {
      setBusy(null);
    }
  };

  const handleDesktop = async () => {
    setBusy("desktop");
    setErr(null);
    try {
      if (authed === false) {
        throw new Error("Sign in required");
      }
      const { ingestToken, userId } = await fetchToken();
      const deeplink = new URL("huntaze-desktop://connect", "http://dummy");
      deeplink.searchParams.set("token", ingestToken);
      deeplink.searchParams.set("user", userId);
      // Attempt to open Electron app via custom protocol
      window.location.href = deeplink.toString().replace("http://dummy", "");
      // Optional fallback after a short delay: show instructions page
      setTimeout(() => {
        try {
          const fallback = new URL("/connect-of", window.location.origin);
          fallback.searchParams.set("token", ingestToken);
          fallback.searchParams.set("user", userId);
          window.location.assign(fallback.toString());
        } catch {}
      }, 1500);
    } catch (e: any) {
      setErr(e?.message || "Failed to open desktop bridge");
    } finally {
      setBusy(null);
    }
  };

  const handleNative = async () => {
    setBusy("native");
    setErr(null);
    try {
      if (authed === false) {
        throw new Error("Sign in required");
      }
      const { ingestToken, userId } = await fetchToken();
      const deep = new URL("huntaze://connect", "http://dummy");
      deep.searchParams.set("token", ingestToken);
      deep.searchParams.set("user", userId);
      // Try to open native app via custom scheme
      window.location.href = deep.toString().replace("http://dummy", "");
      // Fallback to web bridge after 2s
      setTimeout(() => {
        try {
          const fallback = new URL("/connect-of", window.location.origin);
          fallback.searchParams.set("token", ingestToken);
          fallback.searchParams.set("user", userId);
          fallback.searchParams.set("auto", "1");
          window.location.assign(fallback.toString());
        } catch {}
      }, 2000);
    } catch (e: any) {
      const msg = e?.message || "Failed to open native app";
      if (msg === 'Sign in required') {
        setErr("Sign in required");
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(null);
    }
  };

  const btn = (kind: 'ios' | 'desktop' | 'native') => {
    if (variant === 'hz') {
      const base = 'hz-button';
      const primary = kind === 'native' ? ' primary' : '';
      return base + primary;
    }
    // default (tailwind)
    const tw = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50';
    return tw;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={handleIos} disabled={!!busy} className={btn('ios')}>iOS bridge</button>
        <button onClick={handleDesktop} disabled={!!busy} className={btn('desktop')}>Desktop bridge</button>
        <button onClick={handleNative} disabled={!!busy} className={btn('native')}>Open in app</button>
        {err && (
          <span className="ml-2 text-xs text-rose-600">
            {err}{" "}
            {err === 'Sign in required' && (
              <a href="/auth/login" className="underline text-rose-700">Sign in</a>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-900">Alternate login bridges</div>
      <p className="mt-1 text-sm text-slate-600">Use the iOS mini-app or the desktop helper to capture OnlyFans session cookies securely.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variant === 'hz' ? (
          <>
            <button onClick={handleIos} disabled={!!busy} className="hz-button">
              {busy === 'ios' ? 'Opening…' : 'Open iOS bridge'}
            </button>
            <button onClick={handleDesktop} disabled={!!busy} className="hz-button">
              {busy === 'desktop' ? 'Opening…' : 'Open desktop bridge'}
            </button>
            <button onClick={handleNative} disabled={!!busy} className="hz-button primary">
              {busy === 'native' ? 'Opening…' : 'Open in app'}
            </button>
            {err && (
              <div className="hz-muted" style={{ marginLeft: 8 }}>
                {err}{" "}
                {err === 'Sign in required' && (
                  <a href="/auth/login" className="hz-link">Sign in</a>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={handleIos} disabled={!!busy} className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
              {busy === "ios" ? "Opening…" : "Open iOS bridge"}
            </button>
            <button onClick={handleDesktop} disabled={!!busy} className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50">
              {busy === "desktop" ? "Opening…" : "Open desktop bridge"}
            </button>
            <button onClick={handleNative} disabled={!!busy} className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {busy === "native" ? "Opening…" : "Open in app"}
            </button>
            {err && (
              <span className="text-xs text-rose-600">
                {err}{" "}
                {err === 'Sign in required' && (
                  <a href="/auth/login" className="underline">Sign in</a>
                )}
              </span>
            )}
          </>
        )}
      </div>
      {err && <div className="mt-2 text-xs text-rose-600">{err}</div>}
    </div>
  );
}

export default BridgeLauncher;
