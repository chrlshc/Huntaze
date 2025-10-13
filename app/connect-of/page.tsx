"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type BIPEvent = any; // BeforeInstallPromptEvent (Chromium only)

export default function ConnectOfLanding() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const user = sp.get("user") || "";

  const [opened, setOpened] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const bipRef = useRef<BIPEvent | null>(null);

  const deepLink = useMemo(() => {
    try {
      const u = new URL("huntaze://connect", "http://dummy");
      if (token) u.searchParams.set("token", token);
      if (user) u.searchParams.set("user", user);
      return u.toString().replace("http://dummy", "");
    } catch {
      return "";
    }
  }, [token, user]);

  // Env detection
  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iPhone|iPad|iPod/i.test(ua) ||
      (typeof navigator !== "undefined" && (navigator as any).platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
    setIsIOS(!!ios);

    const standalone = typeof window !== "undefined" && (
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true
    );
    setIsStandalone(!!standalone);
  }, []);

  // Capture install prompt (Chromium / Android)
  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      bipRef.current = e as BIPEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP as any);
    return () => window.removeEventListener("beforeinstallprompt", onBIP as any);
  }, []);

  // iOS PWA: auto deep-link + silent fallback to /of-connect
  useEffect(() => {
    if (!token) return;
    if (isIOS && isStandalone) {
      const timer = setTimeout(() => {
        try {
          const u = new URL("/of-connect", window.location.origin);
          u.searchParams.set("token", token);
          u.searchParams.set("user", user);
          router.replace(u.toString());
        } catch {
          router.replace("/of-connect");
        }
      }, 2000);
      try {
        if (deepLink) {
          window.location.href = deepLink;
          setOpened(true);
        }
      } catch {
        // ignore, fallback will trigger
      }
      return () => clearTimeout(timer);
    }
  }, [isIOS, isStandalone, deepLink, token, user, router]);

  const onInstallClick = async () => {
    const evt = bipRef.current;
    if (evt?.prompt) {
      const r = await evt.prompt();
      // r.outcome could be 'accepted' | 'dismissed'
      setCanInstall(false);
      bipRef.current = null;
    }
  };

  const openInApp = () => {
    if (deepLink) {
      window.location.href = deepLink;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Prevent indexing to avoid leaking tokens in URLs */}
      <meta name="robots" content="noindex,nofollow" />
      <section className="mx-auto max-w-xl px-4 pb-16 pt-12">
        <h1 className="text-xl font-semibold text-slate-900">Huntaze Connect</h1>
        <p className="mt-1 text-slate-600">
          If the app didn’t open automatically, you can install the app or continue with the web flow.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-700">Token</div>
          <code className="mt-1 block truncate rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-900">
            {token ? `${token.slice(0, 6)}…${token.slice(-6)}` : "—"}
          </code>

          {/* PWA install block when not standalone */}
          {!isStandalone && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-800">Install the app</div>
              {/* Android / Chromium */}
              {!isIOS && canInstall && (
                <button onClick={onInstallClick} className="mt-2 inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
                  Install app
                </button>
              )}
              {/* iOS guide */}
              {isIOS && (
                <div className="mt-2 text-sm text-slate-700">
                  <p>On iPhone, add to Home Screen:</p>
                  <ol className="ml-5 list-decimal space-y-1">
                    <li>Tap the Share button.</li>
                    <li>Select <strong>Add to Home Screen</strong>.</li>
                    <li>Open from the new Huntaze icon.</li>
                  </ol>
                  <p className="mt-1 text-xs text-slate-500">iOS does not support the native PWA install prompt.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={openInApp} className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
              Open in app
            </button>
            {!opened && <span className="text-xs text-slate-500">If nothing happens, install the app then try again.</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
