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
    <div className="hz" data-theme="light">
      {/* Prevent indexing to avoid leaking tokens in URLs */}
      <meta name="robots" content="noindex,nofollow" />
      <main className="hz-main">
        <div className="hz-page" style={{ maxWidth: 720 }}>
          <h1>Huntaze Connect</h1>

          <div className="hz-card" style={{ marginTop: 12 }}>
            <div className="hz-card__body">
              <div className="hz-muted">Token</div>
              <code className="hz-code">{token ? `${token.slice(0, 6)}…${token.slice(-6)}` : "—"}</code>

              {/* PWA install block when not standalone */}
              {!isStandalone && (
                <div style={{ marginTop: 12 }}>
                  <h3 className="hz-card__title">Install the app</h3>
                  {/* Android / Chromium */}
                  {!isIOS && canInstall && (
                    <button onClick={onInstallClick} className="hz-button primary" style={{ marginTop: 8 }}>
                      Install app
                    </button>
                  )}
                  {/* iOS guide */}
                  {isIOS && (
                    <div className="hz-text-sm" style={{ marginTop: 8 }}>
                      <p>On iPhone, add to Home Screen:</p>
                      <ol className="hz-list hz-list--ordered">
                        <li>Tap the Share button.</li>
                        <li>Select <strong>Add to Home Screen</strong>.</li>
                        <li>Open from the new Huntaze icon.</li>
                      </ol>
                      <p className="hz-muted">iOS does not support the native PWA install prompt.</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={openInApp} className="hz-button">Open in app</button>
                {!opened && <span className="hz-muted">If nothing happens, install the app then try again.</span>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
