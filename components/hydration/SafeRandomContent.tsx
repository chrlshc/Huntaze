'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { useSSRData } from './SSRDataProvider';

interface SafeRandomContentProps {
  children: (randomValue: number) => ReactNode;
  seed?: string | number;
  min?: number;
  max?: number;
  className?: string;
  fallback?: ReactNode;
}

/**
 * SafeRandomContent - Composant pour générer du contenu aléatoire de manière hydration-safe
 * 
 * Ce composant résout les problèmes d'hydratation liés au contenu aléatoire en:
 * 1. Utilisant une seed pour générer des valeurs cohérentes
 * 2. Stockant les valeurs aléatoires pour la cohérence serveur/client
 * 3. Fournissant des fallbacks pendant l'hydratation
 * 4. Évitant les mismatches de contenu aléatoire
 */
export function SafeRandomContent({
  children,
  seed,
  min = 0,
  max = 1,
  className,
  fallback
}: SafeRandomContentProps) {
  const { getData, setData, isHydrated } = useSSRData();
  const randomKey = `random-${seed || 'default'}-${min}-${max}`;

  const generateSeededRandom = (seedValue: string | number): number => {
    // Générateur de nombres pseudo-aléatoires basé sur une seed
    const seedStr = seedValue.toString();
    let hash = 0;
    
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit integer
    }
    
    // Normaliser entre 0 et 1
    const normalized = Math.abs(hash) / 2147483647;
    
    // Ajuster à la plage demandée
    return min + (normalized * (max - min));
  };

  const getRandomValue = (): number => {
    // Vérifier si une valeur est déjà stockée
    const storedValue = getData(randomKey);
    if (storedValue !== undefined) {
      return storedValue;
    }

    let randomValue: number;
    
    if (seed !== undefined) {
      // Utiliser la seed pour générer une valeur cohérente
      randomValue = generateSeededRandom(seed);
    } else {
      // Générer une valeur aléatoire et la stocker
      randomValue = min + (Math.random() * (max - min));
    }

    // Stocker la valeur pour la cohérence
    setData(randomKey, randomValue);
    return randomValue;
  };

  const randomValue = getRandomValue();

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      {children(randomValue)}
    </HydrationSafeWrapper>
  );
}

/**
 * Composant pour sélectionner aléatoirement un élément d'un tableau
 */
interface SafeRandomChoiceProps<T> {
  items: T[];
  seed?: string | number;
  children: (selectedItem: T, index: number) => ReactNode;
  className?: string;
  fallback?: ReactNode;
}

export function SafeRandomChoice<T>({
  items,
  seed,
  children,
  className,
  fallback
}: SafeRandomChoiceProps<T>) {
  if (items.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <SafeRandomContent
      seed={seed}
      min={0}
      max={items.length - 1}
      className={className}
      fallback={fallback}
    >
      {(randomValue) => {
        const index = Math.floor(randomValue);
        const selectedItem = items[index];
        return children(selectedItem, index);
      }}
    </SafeRandomContent>
  );
}

/**
 * Composant pour mélanger un tableau de manière cohérente
 */
interface SafeShuffledListProps<T> {
  items: T[];
  seed?: string | number;
  children: (shuffledItems: T[]) => ReactNode;
  className?: string;
  fallback?: ReactNode;
}

export function SafeShuffledList<T>({
  items,
  seed,
  children,
  className,
  fallback
}: SafeShuffledListProps<T>) {
  const { getData, setData } = useSSRData();
  const shuffleKey = `shuffle-${seed || 'default'}-${items.length}`;

  const shuffleArray = (array: T[], seedValue?: string | number): T[] => {
    const shuffled = [...array];
    
    if (seedValue !== undefined) {
      // Mélange déterministe basé sur la seed
      const seedStr = seedValue.toString();
      let hash = 0;
      
      for (let i = 0; i < seedStr.length; i++) {
        const char = seedStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      // Utiliser la seed pour le mélange
      for (let i = shuffled.length - 1; i > 0; i--) {
        hash = (hash * 9301 + 49297) % 233280;
        const j = Math.floor((hash / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } else {
      // Mélange aléatoire standard (Fisher-Yates)
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    
    return shuffled;
  };

  const getShuffledItems = (): T[] => {
    // Vérifier si un ordre mélangé est déjà stocké
    const storedOrder = getData(shuffleKey);
    if (storedOrder && Array.isArray(storedOrder)) {
      // Reconstruire le tableau dans l'ordre stocké
      return storedOrder.map((index: number) => items[index]).filter(Boolean);
    }

    // Générer un nouvel ordre mélangé
    const shuffled = shuffleArray(items, seed);
    
    // Stocker les indices pour la cohérence
    const indices = shuffled.map(item => items.indexOf(item));
    setData(shuffleKey, indices);
    
    return shuffled;
  };

  const shuffledItems = getShuffledItems();

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      {children(shuffledItems)}
    </HydrationSafeWrapper>
  );
}

/**
 * Hook pour générer des IDs uniques de manière cohérente
 */
export function useSafeUniqueId(prefix: string = 'id'): string {
  const { getData, setData } = useSSRData();
  const idKey = `unique-id-${prefix}`;

  const getId = (): string => {
    const storedId = getData(idKey);
    if (storedId) {
      return storedId;
    }

    // Générer un ID basé sur le timestamp et un nombre aléatoire
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueId = `${prefix}-${timestamp}-${random}`;
    
    setData(idKey, uniqueId);
    return uniqueId;
  };

  return getId();
}

/**
 * Composant pour afficher du contenu avec un délai aléatoire
 */
interface SafeDelayedContentProps {
  children: ReactNode;
  minDelay?: number;
  maxDelay?: number;
  seed?: string | number;
  fallback?: ReactNode;
  className?: string;
}

export function SafeDelayedContent({
  children,
  minDelay = 0,
  maxDelay = 1000,
  seed,
  fallback,
  className
}: SafeDelayedContentProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <SafeRandomContent
      seed={seed}
      min={minDelay}
      max={maxDelay}
    >
      {(delay) => {
        useEffect(() => {
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, delay);

          return () => clearTimeout(timer);
        }, [delay]);

        if (!isVisible) {
          return fallback ? <div className={className}>{fallback}</div> : null;
        }

        return <div className={className}>{children}</div>;
      }}
    </SafeRandomContent>
  );
}
// Expor
t par défaut
export default SafeRandomContent;