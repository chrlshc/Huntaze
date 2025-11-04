'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { hydrationDebugger } from '@/lib/utils/hydrationDebugger';

interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  suppressHydrationWarning?: boolean;
  onHydrationError?: (error: Error) => void;
  className?: string;
  id?: string;
}

/**
 * HydrationSafeWrapper - Composant wrapper pour gérer l'hydratation de manière sécurisée
 * 
 * Ce composant résout les problèmes d'hydratation en:
 * 1. Détectant si le rendu se fait côté serveur ou client
 * 2. Fournissant des fallbacks pendant l'hydratation
 * 3. Gérant les erreurs d'hydratation de manière gracieuse
 * 4. Permettant le rendu progressif des composants client-only
 */
export function HydrationSafeWrapper({
  children,
  fallback = null,
  suppressHydrationWarning = false,
  onHydrationError,
  className,
  id
}: HydrationSafeWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Marquer comme hydraté après le premier rendu client
      setIsHydrated(true);
      
      // Logger l'hydratation réussie
      hydrationDebugger.logHydrationSuccess(id || 'anonymous-wrapper');
    } catch (error) {
      const hydrationError = error instanceof Error ? error : new Error('Unknown hydration error');
      setHydrationError(hydrationError);
      
      // Logger l'erreur d'hydratation
      hydrationDebugger.logHydrationError(id || 'anonymous-wrapper', hydrationError);
      
      // Appeler le callback d'erreur si fourni
      onHydrationError?.(hydrationError);
    }
  }, [id, onHydrationError]);

  // Si une erreur d'hydratation s'est produite, afficher le fallback
  if (hydrationError) {
    return (
      <div 
        className={`hydration-error-fallback ${className || ''}`}
        id={id}
        data-hydration-error="true"
      >
        {fallback || (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Contenu en cours de chargement...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Pendant l'hydratation, afficher le fallback si fourni
  if (!isHydrated && fallback) {
    return (
      <div 
        className={`hydration-loading ${className || ''}`}
        id={id}
        data-hydration-state="loading"
      >
        {fallback}
      </div>
    );
  }

  // Une fois hydraté, afficher le contenu normal
  return (
    <div 
      className={className}
      id={id}
      data-hydration-state="complete"
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </div>
  );
}

/**
 * Hook pour détecter l'état d'hydratation
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Composant pour le rendu client-only avec fallback serveur
 */
interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function ClientOnly({ children, fallback, className }: ClientOnlyProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return fallback ? (
      <div className={className} data-client-only="loading">
        {fallback}
      </div>
    ) : null;
  }

  return (
    <div className={className} data-client-only="ready">
      {children}
    </div>
  );
}

/**
 * HOC pour wrapper automatiquement les composants avec HydrationSafeWrapper
 */
export function withHydrationSafety<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    suppressHydrationWarning?: boolean;
  }
) {
  const WrappedComponent = (props: P) => (
    <HydrationSafeWrapper
      fallback={options?.fallback}
      suppressHydrationWarning={options?.suppressHydrationWarning}
    >
      <Component {...props} />
    </HydrationSafeWrapper>
  );

  WrappedComponent.displayName = `withHydrationSafety(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Export par défaut
export default HydrationSafeWrapper;