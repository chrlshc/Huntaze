"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function ConnectOfLanding() {
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const user = sp.get("user") || "";
  const auto = sp.get("auto") === "1";

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

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const ua = nav?.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (nav && (nav as any).platform === "MacIntel" && (nav as any).maxTouchPoints > 1);
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia?.("(display-mode: standalone)").matches || (nav as any)?.standalone === true
  );
  const shouldAutoOpen = Boolean(auto && isIOS && isStandalone && deepLink && token);

  // iOS PWA: auto deep-link only if explicitly requested via ?auto=1
  useEffect(() => {
    if (!shouldAutoOpen) return;
    try {
      window.location.href = deepLink;
    } catch {
      // ignore; user stays on this page
    }
  }, [shouldAutoOpen, deepLink]);

  const opened = shouldAutoOpen;

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
