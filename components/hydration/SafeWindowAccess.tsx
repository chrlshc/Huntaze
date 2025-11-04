'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';

interface SafeWindowAccessProps {
  children: (windowAPI: {
    innerWidth: number;
    innerHeight: number;
    scrollY: number;
    scrollX: number;
    location: Location | null;
    addEventListener: (event: string, handler: EventListener) => void;
    removeEventListener: (event: string, handler: EventListener) => void;
    open: (url: string, target?: string, features?: string) => Window | null;
    isAvailable: boolean;
  }) => ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * SafeWindowAccess - Composant pour l'accès sécurisé à l'objet window
 * 
 * Ce composant résout les problèmes d'hydratation liés à window en:
 * 1. Fournissant des valeurs par défaut côté serveur
 * 2. Initialisant les vraies valeurs après l'hydratation
 * 3. Gérant les événements de manière sécurisée
 * 4. Offrant une API cohérente serveur/client
 */
export function SafeWindowAccess({ children, fallback, className }: SafeWindowAccessProps) {
  const [windowState, setWindowState] = useState({
    innerWidth: 1024,
    innerHeight: 768,
    scrollY: 0,
    scrollX: 0,
    location: null as Location | null,
    isAvailable: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateWindowState = () => {
        setWindowState({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          location: window.location,
          isAvailable: true
        });
      };

      // Initialiser l'état
      updateWindowState();

      // Écouter les changements
      const handleResize = () => updateWindowState();
      const handleScroll = () => updateWindowState();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const windowAPI = {
    ...windowState,
    addEventListener: (event: string, handler: EventListener) => {
      if (typeof window !== 'undefined') {
        window.addEventListener(event, handler);
      }
    },
    removeEventListener: (event: string, handler: EventListener) => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(event, handler);
      }
    },
    open: (url: string, target?: string, features?: string) => {
      if (typeof window !== 'undefined') {
        return window.open(url, target, features);
      }
      return null;
    }
  };

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      {children(windowAPI)}
    </HydrationSafeWrapper>
  );
}

/**
 * Hook pour l'accès sécurisé aux dimensions de la fenêtre
 */
export function useWindowSize() {
  const [size, setSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  return size;
}

/**
 * Hook pour l'accès sécurisé au scroll
 */
export function useWindowScroll() {
  const [scroll, setScroll] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateScroll = () => {
        setScroll({
          x: window.scrollX,
          y: window.scrollY
        });
      };

      updateScroll();
      window.addEventListener('scroll', updateScroll);
      return () => window.removeEventListener('scroll', updateScroll);
    }
  }, []);

  return scroll;
}

/**
 * Composant pour détecter la taille d'écran de manière hydration-safe
 */
interface ResponsiveWrapperProps {
  children: (breakpoint: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
  }) => ReactNode;
  fallback?: ReactNode;
}

export function ResponsiveWrapper({ children, fallback }: ResponsiveWrapperProps) {
  const { width } = useWindowSize();

  const breakpoint = {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width
  };

  return (
    <HydrationSafeWrapper fallback={fallback}>
      {children(breakpoint)}
    </HydrationSafeWrapper>
  );
}