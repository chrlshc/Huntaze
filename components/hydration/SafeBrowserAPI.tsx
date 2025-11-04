'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';

interface SafeBrowserAPIProps {
  children: (api: BrowserAPIContext) => ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface BrowserAPIContext {
  window: Window | null;
  document: Document | null;
  navigator: Navigator | null;
  localStorage: Storage | null;
  sessionStorage: Storage | null;
  isClient: boolean;
  screen: Screen | null;
  location: Location | null;
}

/**
 * SafeBrowserAPI - Wrapper pour l'accès sécurisé aux APIs du navigateur
 * 
 * Ce composant résout les problèmes d'hydratation liés aux APIs du navigateur en:
 * 1. Fournissant des valeurs null côté serveur
 * 2. Initialisant les APIs après l'hydratation
 * 3. Gérant les erreurs d'accès aux APIs
 * 4. Offrant des fallbacks pendant le chargement
 */
export function SafeBrowserAPI({ children, fallback, className }: SafeBrowserAPIProps) {
  const [browserAPI, setBrowserAPI] = useState<BrowserAPIContext>({
    window: null,
    document: null,
    navigator: null,
    localStorage: null,
    sessionStorage: null,
    isClient: false,
    screen: null,
    location: null
  });

  useEffect(() => {
    // Initialiser les APIs du navigateur après l'hydratation
    try {
      setBrowserAPI({
        window: typeof window !== 'undefined' ? window : null,
        document: typeof document !== 'undefined' ? document : null,
        navigator: typeof navigator !== 'undefined' ? navigator : null,
        localStorage: typeof localStorage !== 'undefined' ? localStorage : null,
        sessionStorage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
        isClient: true,
        screen: typeof screen !== 'undefined' ? screen : null,
        location: typeof location !== 'undefined' ? location : null
      });
    } catch (error) {
      console.error('Browser API initialization error:', error);
      // Garder les valeurs null en cas d'erreur
    }
  }, []);

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      {children(browserAPI)}
    </HydrationSafeWrapper>
  );
}

/**
 * Hook pour l'accès sécurisé aux APIs du navigateur
 */
export function useSafeBrowserAPI(): BrowserAPIContext {
  const [browserAPI, setBrowserAPI] = useState<BrowserAPIContext>({
    window: null,
    document: null,
    navigator: null,
    localStorage: null,
    sessionStorage: null,
    isClient: false,
    screen: null,
    location: null
  });

  useEffect(() => {
    setBrowserAPI({
      window: typeof window !== 'undefined' ? window : null,
      document: typeof document !== 'undefined' ? document : null,
      navigator: typeof navigator !== 'undefined' ? navigator : null,
      localStorage: typeof localStorage !== 'undefined' ? localStorage : null,
      sessionStorage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
      isClient: true,
      screen: typeof screen !== 'undefined' ? screen : null,
      location: typeof location !== 'undefined' ? location : null
    });
  }, []);

  return browserAPI;
}

/**
 * Composant pour l'accès sécurisé au localStorage
 */
interface SafeLocalStorageProps {
  children: (storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    isAvailable: boolean;
  }) => ReactNode;
  fallback?: ReactNode;
}

export function SafeLocalStorage({ children, fallback }: SafeLocalStorageProps) {
  const { localStorage, isClient } = useSafeBrowserAPI();

  const storageAPI = {
    getItem: (key: string): string | null => {
      if (!localStorage) return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (!localStorage) return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignorer les erreurs de stockage
      }
    },
    removeItem: (key: string): void => {
      if (!localStorage) return;
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignorer les erreurs de suppression
      }
    },
    isAvailable: !!localStorage
  };

  if (!isClient && fallback) {
    return <>{fallback}</>;
  }

  return <>{children(storageAPI)}</>;
}

/**
 * Composant pour l'accès sécurisé aux informations de l'écran
 */
interface SafeScreenInfoProps {
  children: (screenInfo: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape' | 'unknown';
  }) => ReactNode;
  fallback?: ReactNode;
}

export function SafeScreenInfo({ children, fallback }: SafeScreenInfoProps) {
  const { screen, window: win, isClient } = useSafeBrowserAPI();
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'unknown' as const
  });

  useEffect(() => {
    if (!isClient || !win) return;

    const updateScreenInfo = () => {
      const width = win.innerWidth || screen?.width || 0;
      const height = win.innerHeight || screen?.height || 0;
      
      setScreenInfo({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    updateScreenInfo();
    win.addEventListener('resize', updateScreenInfo);
    win.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      win.removeEventListener('resize', updateScreenInfo);
      win.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, [isClient, win, screen]);

  if (!isClient && fallback) {
    return <>{fallback}</>;
  }

  return <>{children(screenInfo)}</>;
}

/**
 * Composant pour l'accès sécurisé aux informations de géolocalisation
 */
interface SafeGeolocationProps {
  children: (geolocation: {
    getCurrentPosition: (
      success: (position: GeolocationPosition) => void,
      error?: (error: GeolocationPositionError) => void
    ) => void;
    isAvailable: boolean;
  }) => ReactNode;
  fallback?: ReactNode;
}

export function SafeGeolocation({ children, fallback }: SafeGeolocationProps) {
  const { navigator, isClient } = useSafeBrowserAPI();

  const geolocationAPI = {
    getCurrentPosition: (
      success: (position: GeolocationPosition) => void,
      error?: (error: GeolocationPositionError) => void
    ) => {
      if (!navigator?.geolocation) {
        error?.({
          code: 2,
          message: 'Geolocation not available',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError);
        return;
      }

      navigator.geolocation.getCurrentPosition(success, error);
    },
    isAvailable: !!navigator?.geolocation
  };

  if (!isClient && fallback) {
    return <>{fallback}</>;
  }

  return <>{children(geolocationAPI)}</>;
}

// Export par défaut
export default SafeBrowserAPI;