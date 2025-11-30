"use client";
import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/components/usePWAInstall';
import { IOSA2HSOverlay } from '@/components/IOSA2HSOverlay';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function OFConnectBanner() {
  const { isIOS, isStandalone, canInstall, promptInstall } = usePWAInstall();
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isIOS && !isStandalone) {
      const dismissed = typeof window !== 'undefined' ? localStorage.getItem('iosA2HS.dismissed') : '1';
      if (!dismissed) setShowIOS(true);
    }
  }, [isIOS, isStandalone]);

  return (
    <>
      <section className="rounded-xl border bg-white p-4 md:p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-medium">Connect your OnlyFans account</h2>
            <p className="text-sm text-gray-600">
              Start a secure server-side login. Use the desktop bridge, the iOS bridge, or the native app deep link.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* CTA principal = installation PWA quand dispo (Android/Chromium) */}
            {canInstall && (
              <Button variant="primary" onClick={promptInstall}>
                Install app
              </Button>
            )}
            {/* iOS : affiche un guide A2HS */}
            {isIOS && !isStandalone && (
              <Button variant="secondary" onClick={() => setShowIOS(true)}>
                How to install on iPhone
              </Button>
            )}
            {/* Optionnel : ouvrir l'app (jamais auto ici) */}
            <Button variant="primary" onClick={() => (window.location.href = 'huntaze://connect')}>
              Open in app
            </Button>

            {/* Liens techniques existants */}
            <Link href="/of-connect" className="px-3 py-2 text-sm text-gray-600 underline">
              Desktop bridge
            </Link>
            <Link href="/of-connect" className="px-3 py-2 text-sm text-gray-600 underline">
              iOS bridge
            </Link>
          </div>
        </div>
      </section>

      <IOSA2HSOverlay
        open={showIOS}
        onClose={() => {
          try { localStorage.setItem('iosA2HS.dismissed', '1'); } catch {}
          setShowIOS(false);
        }}
      />
    </>
  );
}
