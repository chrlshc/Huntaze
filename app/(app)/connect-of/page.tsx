"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function ConnectOfLanding() {
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const user = sp.get("user") || "";
  const auto = sp.get("auto") === "1";

  const [opened, setOpened] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

  // iOS PWA: auto deep-link only if explicitly requested via ?auto=1
  useEffect(() => {
    if (!token) return;
    if (auto && isIOS && isStandalone && deepLink) {
      try {
        window.location.href = deepLink;
        setOpened(true);
      } catch {
        // ignore; user stays on this page
      }
    }
  }, [auto, isIOS, isStandalone, deepLink, token]);

  const openInApp = () => {
    if (deepLink) window.location.href = deepLink;
  };

  return (
    <div className="hz" data-theme="light">
      <meta name="robots" content="noindex,nofollow" />
      <main className="hz-main">
        <div className="hz-page" style={{ maxWidth: 720 }}>
          <h1>Huntaze Connect</h1>

          <Card style={{ marginTop: 12 }}>
            <div className="hz-card__body">
              <div className="hz-muted">Token</div>
              <code className="hz-code">{token ? `${token.slice(0, 6)}…${token.slice(-6)}` : "—"}</code>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={openInApp}>Open in app</Button>
                {!opened && <span className="hz-muted">If nothing happens, install the app then try again.</span>}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
