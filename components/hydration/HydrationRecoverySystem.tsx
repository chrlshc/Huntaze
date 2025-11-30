'use client';

import React, { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { hydrationDebugger } from '@/lib/utils/hydrationDebugger';
import { Button } from "@/components/ui/button";

interface HydrationRecoveryConfig {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  fallbackDelay?: number;
  preserveState?: boolean;
  enableManualRecovery?: boolean;
}

interface HydrationRecoverySystemProps {
  children: ReactNode;
  config?: HydrationRecoveryConfig;
  fallback?: ReactNode;
  onRecoveryAttempt?: (attempt: number, error: Error) => void;
  onRecoverySuccess?: () => void;
  onRecoveryFailure?: (finalError: Error) => void;
  className?: string;
  id?: string;
}

interface RecoveryState {
  isRecovering: boolean;
  retryCount: number;
  lastError: Error | null;
  recoveryStartTime: number;
  userState: any;
}

/**
 * HydrationRecoverySystem - Système complet de récupération d'erreurs d'hydratation
 * 
 * Ce composant implémente :
 * 1. Retry automatique avec backoff exponentiel
 * 2. Préservation de l'état utilisateur
 * 3. Fallbacks gracieux
 * 4. Recovery manuel
 * 5. Monitoring et logging des tentatives
 */
export function HydrationRecoverySystem({
  children,
  config = {},
  fallback,
  onRecoveryAttempt,
  onRecoverySuccess,
  onRecoveryFailure,
  className,
  id = 'hydration-recovery'
}: HydrationRecoverySystemProps) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    fallbackDelay = 5000,
    preserveState = true,
    enableManualRecovery = true
  } = config;

  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    retryCount: 0,
    lastError: null,
    recoveryStartTime: 0,
    userState: null
  });

  const [showFallback, setShowFallback] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour calculer le délai de retry avec backoff exponentiel
  const calculateRetryDelay = useCallback((attempt: number): number => {
    if (!exponentialBackoff) {
      return retryDelay;
    }
    return retryDelay * Math.pow(2, attempt - 1);
  }, [retryDelay, exponentialBackoff]);

  // Fonction pour préserver l'état utilisateur
  const preserveUserState = useCallback(() => {
    if (!preserveState) return null;

    try {
      // Capturer l'état des formulaires, scroll, etc.
      const state = {
        scrollPosition: {
          x: window.scrollX || 0,
          y: window.scrollY || 0
        },
        formData: captureFormData(),
        timestamp: Date.now()
      };
      
      return state;
    } catch (error) {
      console.warn('Failed to preserve user state:', error);
      return null;
    }
  }, [preserveState]);

  // Fonction pour restaurer l'état utilisateur
  const restoreUserState = useCallback((state: any) => {
    if (!state || !preserveState) return;

    try {
      // Restaurer la position de scroll
      if (state.scrollPosition) {
        window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
      }

      // Restaurer les données de formulaire
      if (state.formData) {
        restoreFormData(state.formData);
      }
    } catch (error) {
      console.warn('Failed to restore user state:', error);
    }
  }, [preserveState]);

  // Fonction principale de retry
  const attemptRecovery = useCallback(async (error: Error) => {
    const currentAttempt = recoveryState.retryCount + 1;
    
    // Vérifier si on a atteint le maximum de tentatives
    if (currentAttempt > maxRetries) {
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false
      }));
      
      onRecoveryFailure?.(error);
      // hydrationDebugger.logRecoveryFailure(id, error, currentAttempt);
      
      // Afficher le fallback après le délai configuré
      fallbackTimeoutRef.current = setTimeout(() => {
        setShowFallback(true);
      }, fallbackDelay);
      
      return;
    }

    // Préserver l'état utilisateur avant la tentative
    const userState = preserveUserState();
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      retryCount: currentAttempt,
      lastError: error,
      recoveryStartTime: prev.recoveryStartTime || Date.now(),
      userState: userState || prev.userState
    }));

    onRecoveryAttempt?.(currentAttempt, error);
    // hydrationDebugger.logRecoveryAttempt(id, error, currentAttempt);

    // Calculer le délai de retry
    const delay = calculateRetryDelay(currentAttempt);
    
    // Programmer la tentative de recovery
    retryTimeoutRef.current = setTimeout(() => {
      try {
        // Tenter de re-hydrater le composant
        setIsHydrated(false);
        
        // Forcer un re-render après un court délai
        setTimeout(() => {
          setIsHydrated(true);
          
          // Restaurer l'état utilisateur
          if (userState) {
            restoreUserState(userState);
          }
          
          // Marquer la recovery comme réussie
          setRecoveryState(prev => ({
            ...prev,
            isRecovering: false,
            retryCount: 0,
            lastError: null,
            recoveryStartTime: 0
          }));
          
          onRecoverySuccess?.();
          // hydrationDebugger.logRecoverySuccess(id, currentAttempt);
          
        }, 100);
        
      } catch (retryError) {
        // Si la tentative échoue, essayer à nouveau
        attemptRecovery(retryError as Error);
      }
    }, delay);
    
  }, [
    recoveryState.retryCount,
    maxRetries,
    onRecoveryAttempt,
    onRecoveryFailure,
    onRecoverySuccess,
    calculateRetryDelay,
    preserveUserState,
    restoreUserState,
    fallbackDelay,
    id
  ]);

  // Fonction pour recovery manuel
  const manualRecovery = useCallback(() => {
    if (!enableManualRecovery) return;
    
    // Reset du state de recovery
    setRecoveryState({
      isRecovering: false,
      retryCount: 0,
      lastError: null,
      recoveryStartTime: 0,
      userState: null
    });
    
    setShowFallback(false);
    
    // Forcer une nouvelle hydratation
    setIsHydrated(false);
    setTimeout(() => setIsHydrated(true), 100);
    
    // hydrationDebugger.logManualRecovery(id);
  }, [enableManualRecovery, id]);

  // Gestion des erreurs d'hydratation
  const handleHydrationError = useCallback((error: Error) => {
    console.error('Hydration error detected:', error);
    attemptRecovery(error);
  }, [attemptRecovery]);

  // Cleanup des timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, []);

  // Initialisation de l'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Affichage du fallback en cas d'échec complet
  if (showFallback) {
    return (
      <div className={`hydration-fallback ${className || ''}`} id={id}>
        {fallback || (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 text-sm">⚠</span>
              </div>
              <h3 className="text-yellow-800 font-semibold">
                Problème de chargement
              </h3>
            </div>
            <p className="text-yellow-700 mb-4">
              Nous rencontrons des difficultés à charger cette section. 
              Vos données sont préservées.
            </p>
            {enableManualRecovery && (
              <Button variant="primary" onClick={manualRecovery}>
  Réessayer
</Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Affichage pendant la recovery
  if (recoveryState.isRecovering) {
    return (
      <div className={`hydration-recovering ${className || ''}`} id={id}>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">
              Récupération en cours... (Tentative {recoveryState.retryCount}/{maxRetries})
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Rendu normal avec gestion d'erreur
  return (
    <HydrationSafeWrapper
      onHydrationError={handleHydrationError}
      className={className}
      id={id}
      suppressHydrationWarning={true}
    >
      {isHydrated ? children : null}
    </HydrationSafeWrapper>
  );
}

// Utilitaires pour la préservation d'état
function captureFormData(): Record<string, any> {
  const formData: Record<string, any> = {};
  
  try {
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const data = new FormData(form);
      formData[`form-${index}`] = Object.fromEntries(data.entries());
    });
    
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      if (input instanceof HTMLInputElement || 
          input instanceof HTMLTextAreaElement || 
          input instanceof HTMLSelectElement) {
        formData[`input-${index}`] = {
          id: input.id,
          name: input.name,
          value: input.value,
          type: input.type || 'text'
        };
      }
    });
  } catch (error) {
    console.warn('Failed to capture form data:', error);
  }
  
  return formData;
}

function restoreFormData(formData: Record<string, any>): void {
  try {
    Object.entries(formData).forEach(([key, value]) => {
      if (key.startsWith('input-') && value && typeof value === 'object') {
        const input = value.id 
          ? document.getElementById(value.id)
          : document.querySelector(`[name="${value.name}"]`);
          
        if (input instanceof HTMLInputElement || 
            input instanceof HTMLTextAreaElement || 
            input instanceof HTMLSelectElement) {
          input.value = value.value || '';
        }
      }
    });
  } catch (error) {
    console.warn('Failed to restore form data:', error);
  }
}

/**
 * Hook pour utiliser le système de recovery
 */
export function useHydrationRecovery(config?: HydrationRecoveryConfig) {
  const [recoveryState, setRecoveryState] = useState({
    isRecovering: false,
    canRecover: true,
    lastError: null as Error | null
  });

  const triggerRecovery = useCallback((error: Error) => {
    setRecoveryState({
      isRecovering: true,
      canRecover: true,
      lastError: error
    });
  }, []);

  const resetRecovery = useCallback(() => {
    setRecoveryState({
      isRecovering: false,
      canRecover: true,
      lastError: null
    });
  }, []);

  return {
    ...recoveryState,
    triggerRecovery,
    resetRecovery
  };
}