"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

type BIPEvent = any; // non-standard (Chromium)

export default function PWAInstall({ className }: { className?: string }) {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const bipRef = useRef<BIPEvent | null>(null);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iPhone|iPad|iPod/i.test(ua) ||
      (typeof navigator !== "undefined" && (navigator as any).platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
    setIsIOS(!!ios);
  }, []);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      bipRef.current = e as BIPEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP as any);
    return () => window.removeEventListener("beforeinstallprompt", onBIP as any);
  }, []);

  const onInstall = async () => {
    const evt = bipRef.current;
    if (evt?.prompt) {
      await evt.prompt();
      setCanInstall(false);
      bipRef.current = null;
    }
  };

  return (
    <div className={className}>
      <Card>
        <div className="hz-card__body">
          <h3 className="hz-card__title">Install the app</h3>
          {/* Android / Chromium */}
          {!isIOS && canInstall && (
            <Button variant="primary" onClick={onInstall}>Install app</Button>
          )}
          {/* iOS guide */}
          {isIOS && (
            <div className="hz-text-sm" aria-live="polite">
              <p>On iPhone, add Huntaze to your Home Screen:</p>
              <ol className="hz-list hz-list--ordered">
                <li>Tap the Share button in Safari.</li>
                <li>Select <strong>Add to Home Screen</strong>.</li>
                <li>Open Huntaze from the new icon.</li>
              </ol>
              <p className="hz-muted">iOS does not support the native PWA install prompt.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

