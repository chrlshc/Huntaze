"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

type TokenResp = { ingestToken: string; userId: string; apiBase?: string };

async function fetchToken(): Promise<TokenResp> {
  const res = await fetch("/api/of/ingest-token", { method: "POST", credentials: 'include' as RequestCredentials });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Sign in required');
    const t = await res.text().catch(() => '');
    throw new Error(t || "Unable to create ingest token");
  }
  return res.json();
}

export function BridgeLauncher({ compact = false, variant = 'default' }: { compact?: boolean; variant?: 'default' | 'hz' }) {
  const [busy, setBusy] = useState<"ios" | "desktop" | "native" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleIos = async () => {
    setBusy("ios");
    setErr(null);
    try {
      // With AASA removed, use the web flow directly
      window.location.assign('/of-connect');
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
      const { ingestToken, userId } = await fetchToken();
      const deeplink = new URL("huntaze-desktop://connect", "http://dummy");
      deeplink.searchParams.set("token", ingestToken);
      deeplink.searchParams.set("user", userId);
      // Attempt to open Electron app via custom protocol
      window.location.href = deeplink.toString().replace("http://dummy", "");
      // Optional fallback after a short delay: go to web connect
      setTimeout(() => {
        try {
          const fallback = new URL("/of-connect", window.location.origin);
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
      const { ingestToken, userId } = await fetchToken();
      const deep = new URL("huntaze://connect", "http://dummy");
      deep.searchParams.set("token", ingestToken);
      deep.searchParams.set("user", userId);
      // Try to open native app via custom scheme
      window.location.href = deep.toString().replace("http://dummy", "");
      // Fallback to web connect after 2s
      setTimeout(() => {
        try {
          const fallback = new URL("/of-connect", window.location.origin);
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
        <Button variant="primary" onClick={handleIos} disabled={!!busy}>iOS bridge</Button>
        <Button variant="primary" onClick={handleDesktop} disabled={!!busy}>Desktop bridge</Button>
        <Button variant="primary" onClick={handleNative} disabled={!!busy}>Open in app</Button>
        {err && (
          <span className="ml-2 text-xs text-rose-600">
            {err}{" "}
            {err === 'Sign in required' && (
              <a href="/auth/login?next=/of-connect" className="underline text-rose-700">Sign in</a>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-900">Alternate login bridges</div>
      <p className="mt-1 text-sm text-slate-600">Use the iOS mini-app or the desktop helper to capture OnlyFans session cookies securely.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variant === 'hz' ? (
          <>
            <Button variant="primary" onClick={handleIos} disabled={!!busy}>
  {busy === 'ios' ? 'Opening…' : 'Open iOS bridge'}
</Button>
            <Button variant="primary" onClick={handleDesktop} disabled={!!busy}>
  {busy === 'desktop' ? 'Opening…' : 'Open desktop bridge'}
</Button>
            <Button variant="primary" onClick={handleNative} disabled={!!busy}>
              {busy === 'native' ? 'Opening…' : 'Open in app'}
            </Button>
            {err && (
              <div className="hz-muted" style={{ marginLeft: 8 }}>
                {err}{" "}
                {err === 'Sign in required' && (
                  <a href="/auth/login?next=/of-connect" className="hz-link">Sign in</a>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Button variant="primary" onClick={handleIos} disabled={!!busy}>
              {busy === "ios" ? "Opening…" : "Open iOS bridge"}
            </Button>
            <Button variant="primary" onClick={handleDesktop} disabled={!!busy}>
              {busy === "desktop" ? "Opening…" : "Open desktop bridge"}
            </Button>
            <Button variant="primary" onClick={handleNative} disabled={!!busy}>
              {busy === "native" ? "Opening…" : "Open in app"}
            </Button>
            {err && (
              <span className="text-xs text-rose-600">
                {err}{" "}
                {err === 'Sign in required' && (
                  <a href="/auth/login?next=/of-connect" className="underline">Sign in</a>
                )}
              </span>
            )}
          </>
        )}
      </div>
      {err && <div className="mt-2 text-xs text-rose-600">{err}</div>}
    </Card>
  );
}

export default BridgeLauncher;
