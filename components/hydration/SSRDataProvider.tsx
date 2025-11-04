'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { hydrationDebugger } from '@/lib/utils/hydrationDebugger';

interface SSRData {
  [key: string]: any;
}

interface SSRDataContextValue {
  data: SSRData;
  setData: (key: string, value: any) => void;
  getData: (key: string, defaultValue?: any) => any;
  isHydrated: boolean;
  hydrationId: string;
}

const SSRDataContext = createContext<SSRDataContextValue | null>(null);

interface SSRDataProviderProps {
  children: ReactNode;
  initialData?: SSRData;
  hydrationId?: string;
}

/**
 * SSRDataProvider - Fournit un système de gestion des données cohérent entre serveur et client
 * 
 * Ce composant résout les problèmes d'hydratation liés aux données en:
 * 1. Sérialisant les données de manière cohérente entre serveur et client
 * 2. Gérant l'état d'hydratation des données
 * 3. Fournissant des utilitaires de synchronisation des données
 * 4. Permettant la récupération gracieuse en cas d'incohérence
 */
export function SSRDataProvider({ 
  children, 
  initialData = {}, 
  hydrationId = 'default' 
}: SSRDataProviderProps) {
  const [data, setDataState] = useState<SSRData>(initialData);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      // Vérifier si des données sont stockées côté client
      const clientData = getClientStoredData(hydrationId);
      
      if (clientData) {
        // Comparer les données serveur et client
        const hasDataMismatch = compareSSRData(initialData, clientData);
        
        if (hasDataMismatch) {
          hydrationDebugger.logDataMismatch(hydrationId, {
            server: initialData,
            client: clientData
          });
          
          // Utiliser les données client en cas de mismatch
          setDataState(clientData);
        }
      }
      
      setIsHydrated(true);
      hydrationDebugger.logSSRDataHydration(hydrationId, data);
    } catch (error) {
      console.error('SSR Data hydration error:', error);
      hydrationDebugger.logHydrationError(hydrationId, error as Error);
      setIsHydrated(true); // Continuer même en cas d'erreur
    }
  }, [initialData, hydrationId]);

  const setData = (key: string, value: any) => {
    setDataState(prev => {
      const newData = { ...prev, [key]: value };
      
      // Stocker côté client pour la cohérence
      storeClientData(hydrationId, newData);
      
      return newData;
    });
  };

  const getData = (key: string, defaultValue?: any) => {
    return data[key] ?? defaultValue;
  };

  const contextValue: SSRDataContextValue = {
    data,
    setData,
    getData,
    isHydrated,
    hydrationId
  };

  return (
    <SSRDataContext.Provider value={contextValue}>
      {children}
    </SSRDataContext.Provider>
  );
}

/**
 * Hook pour utiliser les données SSR
 */
export function useSSRData() {
  const context = useContext(SSRDataContext);
  
  if (!context) {
    throw new Error('useSSRData must be used within an SSRDataProvider');
  }
  
  return context;
}

/**
 * Hook pour des données spécifiques avec fallback
 */
export function useSSRValue<T>(key: string, defaultValue: T): T {
  const { getData, isHydrated } = useSSRData();
  
  // Pendant l'hydratation, utiliser la valeur par défaut
  if (!isHydrated) {
    return defaultValue;
  }
  
  return getData(key, defaultValue);
}

/**
 * Composant pour afficher des données avec fallback pendant l'hydratation
 */
interface SSRValueProps<T> {
  dataKey: string;
  defaultValue: T;
  render: (value: T, isHydrated: boolean) => ReactNode;
  fallback?: ReactNode;
}

export function SSRValue<T>({ 
  dataKey, 
  defaultValue, 
  render, 
  fallback 
}: SSRValueProps<T>) {
  const { getData, isHydrated } = useSSRData();
  
  if (!isHydrated && fallback) {
    return <>{fallback}</>;
  }
  
  const value = isHydrated ? getData(dataKey, defaultValue) : defaultValue;
  
  return <>{render(value, isHydrated)}</>;
}

/**
 * Utilitaires pour la gestion des données côté client
 */
function getClientStoredData(hydrationId: string): SSRData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(`ssr-data-${hydrationId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeClientData(hydrationId: string, data: SSRData): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(`ssr-data-${hydrationId}`, JSON.stringify(data));
  } catch {
    // Ignorer les erreurs de stockage
  }
}

function compareSSRData(serverData: SSRData, clientData: SSRData): boolean {
  try {
    return JSON.stringify(serverData) !== JSON.stringify(clientData);
  } catch {
    return true; // Considérer comme différent en cas d'erreur
  }
}

/**
 * HOC pour wrapper automatiquement les composants avec SSRDataProvider
 */
export function withSSRData<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    initialData?: SSRData;
    hydrationId?: string;
  }
) {
  const WrappedComponent = (props: P) => (
    <SSRDataProvider
      initialData={options?.initialData}
      hydrationId={options?.hydrationId}
    >
      <Component {...props} />
    </SSRDataProvider>
  );

  WrappedComponent.displayName = `withSSRData(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Export par défaut
export default SSRDataProvider;