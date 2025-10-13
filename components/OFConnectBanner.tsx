"use client";
import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/components/usePWAInstall';
import { IOSA2HSOverlay } from '@/components/IOSA2HSOverlay';
import Link from 'next/link';

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
              <button
                onClick={promptInstall}
                className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition"
              >
                Install app
              </button>
            )}
            {/* iOS : affiche un guide A2HS */}
            {isIOS && !isStandalone && (
              <button
                onClick={() => setShowIOS(true)}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition"
              >
                How to install on iPhone
              </button>
            )}
            {/* Optionnel : ouvrir l’app (jamais auto ici) */}
            <button
              onClick={() => (window.location.href = 'huntaze://connect')}
              className="px-4 py-2 rounded-xl border"
            >
              Open in app
            </button>

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

