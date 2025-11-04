'use client';

import React from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { useSSRData } from './SSRDataProvider';

interface SafeDateRendererProps {
  date?: Date | string | number;
  format?: 'full' | 'short' | 'time' | 'date' | 'relative' | 'year';
  locale?: string;
  className?: string;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

/**
 * SafeDateRenderer - Composant pour afficher les dates de manière hydration-safe
 * 
 * Ce composant résout les problèmes d'hydratation liés aux dates en:
 * 1. Utilisant un timestamp fixe côté serveur
 * 2. Gérant les différences de timezone entre serveur et client
 * 3. Fournissant des fallbacks pendant l'hydratation
 * 4. Évitant les mismatches de rendu date/heure
 */
export function SafeDateRenderer({
  date,
  format = 'full',
  locale = 'fr-FR',
  className,
  fallback,
  suppressHydrationWarning = true
}: SafeDateRendererProps) {
  const { getData, setData, isHydrated } = useSSRData();

  // Générer une clé unique pour cette instance de date
  const dateKey = `date-${date?.toString() || 'now'}-${format}`;

  // Fonction pour formater la date de manière cohérente
  const formatDate = (dateValue: Date | string | number | undefined): string => {
    if (!dateValue) {
      return '';
    }

    try {
      const dateObj = new Date(dateValue);
      
      if (isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }

      switch (format) {
        case 'year':
          return dateObj.getFullYear().toString();
        
        case 'date':
          return dateObj.toLocaleDateString(locale);
        
        case 'time':
          return dateObj.toLocaleTimeString(locale);
        
        case 'short':
          return dateObj.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        
        case 'relative':
          return getRelativeTime(dateObj, locale);
        
        case 'full':
        default:
          return dateObj.toLocaleString(locale);
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Erreur de format';
    }
  };

  // Pendant l'hydratation, utiliser une valeur mise en cache ou calculer une nouvelle
  const getDisplayValue = (): string => {
    if (!isHydrated) {
      // Côté serveur ou pendant l'hydratation, utiliser une valeur stable
      const cachedValue = getData(dateKey);
      if (cachedValue) {
        return cachedValue;
      }
      
      // Calculer et mettre en cache la valeur
      const formattedValue = formatDate(date);
      setData(dateKey, formattedValue);
      return formattedValue;
    }
    
    // Côté client après hydratation, recalculer si nécessaire
    return formatDate(date);
  };

  const displayValue = getDisplayValue();

  // Fallback pendant le chargement
  const loadingFallback = fallback || (
    <span className="inline-block w-20 h-4 bg-gray-200 animate-pulse rounded" />
  );

  return (
    <HydrationSafeWrapper
      fallback={loadingFallback}
      suppressHydrationWarning={suppressHydrationWarning}
      className={className}
    >
      <span className={className} data-date-format={format}>
        {displayValue}
      </span>
    </HydrationSafeWrapper>
  );
}

/**
 * Composant spécialisé pour l'année courante (cas le plus fréquent)
 */
interface SafeCurrentYearProps {
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeCurrentYear({ className, fallback }: SafeCurrentYearProps) {
  return (
    <SafeDateRenderer
      date={new Date()}
      format="year"
      className={className}
      fallback={fallback}
    />
  );
}

/**
 * Composant pour les timestamps relatifs (il y a X minutes, etc.)
 */
interface SafeRelativeTimeProps {
  date: Date | string | number;
  className?: string;
  updateInterval?: number; // en millisecondes
}

export function SafeRelativeTime({ 
  date, 
  className, 
  updateInterval = 60000 // 1 minute par défaut
}: SafeRelativeTimeProps) {
  const [, setUpdateTrigger] = React.useState(0);

  React.useEffect(() => {
    if (updateInterval > 0) {
      const interval = setInterval(() => {
        setUpdateTrigger(prev => prev + 1);
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [updateInterval]);

  return (
    <SafeDateRenderer
      date={date}
      format="relative"
      className={className}
    />
  );
}

/**
 * Utilitaire pour calculer le temps relatif
 */
function getRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  // Pour les dates plus anciennes, utiliser le format court
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Export par défaut
export default SafeDateRenderer;