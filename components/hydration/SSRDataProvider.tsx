'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

/**
 * SSRDataProvider Component
 * 
 * Provides consistent data between server and client rendering
 * to prevent hydration mismatches.
 */

interface SSRData {
  [key: string]: any;
}

interface SSRDataContextValue {
  data: SSRData;
  setData: (key: string, value: any) => void;
  getData: (key: string) => any;
  isHydrated: boolean;
}

const SSRDataContext = createContext<SSRDataContextValue | null>(null);

interface SSRDataProviderProps {
  children: ReactNode;
  initialData?: SSRData;
}

export function SSRDataProvider({ children, initialData = {} }: SSRDataProviderProps) {
  const [data, setDataState] = useState<SSRData>(initialData);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const setData = (key: string, value: any) => {
    setDataState(prev => ({ ...prev, [key]: value }));
  };

  const getData = (key: string) => {
    return data[key];
  };

  const value: SSRDataContextValue = {
    data,
    setData,
    getData,
    isHydrated,
  };

  return (
    <SSRDataContext.Provider value={value}>
      {children}
    </SSRDataContext.Provider>
  );
}

/**
 * useSSRData Hook
 * 
 * Access SSR data context
 */
export function useSSRData() {
  const context = useContext(SSRDataContext);
  
  if (!context) {
    throw new Error('useSSRData must be used within SSRDataProvider');
  }
  
  return context;
}

/**
 * useHydrationSafeState Hook
 * 
 * State hook that's safe from hydration mismatches
 */
export function useHydrationSafeState<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, boolean] {
  const { getData, setData, isHydrated } = useSSRData();
  
  const value = getData(key) ?? initialValue;
  
  const setValue = (newValue: T) => {
    setData(key, newValue);
  };
  
  return [value, setValue, isHydrated];
}

/**
 * withSSRData HOC
 * 
 * Wraps a component with SSRDataProvider
 */
export function withSSRData<P extends object>(
  Component: React.ComponentType<P>,
  initialData?: SSRData
) {
  return function WithSSRDataComponent(props: P) {
    return (
      <SSRDataProvider initialData={initialData}>
        <Component {...props} />
      </SSRDataProvider>
    );
  };
}
