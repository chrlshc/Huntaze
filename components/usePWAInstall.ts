"use client";
import { useEffect, useRef, useState } from 'react';

// Hook de gestion install PWA + détection PWA/iOS
export function usePWAInstall() {
  const [isIOS] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua);
  });
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true; // iOS Safari
    return !!standalone;
  });
  const [canInstall, setCanInstall] = useState(false); // Android/Chromium
  const bipRef = useRef<any>(null); // BeforeInstallPromptEvent

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      (bipRef as any).current = e as any;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP as any);
    return () => window.removeEventListener('beforeinstallprompt', onBIP as any);
  }, []);

  const promptInstall = async () => {
    const evt: any = bipRef.current;
    if (evt?.prompt) {
      await evt.prompt();
      (bipRef as any).current = null;
      setCanInstall(false);
    }
  };

  return { isIOS, isStandalone, canInstall, promptInstall };
}
