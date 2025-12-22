/**
 * Dashboard Formatters
 * 
 * Utilitaires de formatage pour monnaie, pourcentages et dates.
 * Feature: creator-analytics-dashboard
 */

/**
 * Formate une valeur en devise
 * @param value - Valeur numérique
 * @param currency - Code devise (USD par défaut)
 * @param locale - Locale pour le formatage (en-US par défaut)
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formate un pourcentage avec une décimale
 * @param value - Valeur en pourcentage (ex: 12.5 pour 12.5%)
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Formate un delta avec signe et couleur
 * @param value - Valeur du delta en pourcentage
 */
export function formatDelta(value: number): { text: string; trend: 'up' | 'down' | 'neutral' } {
  if (value > 0) {
    return { text: `+${value.toFixed(1)}%`, trend: 'up' };
  } else if (value < 0) {
    return { text: `${value.toFixed(1)}%`, trend: 'down' };
  }
  return { text: '0.0%', trend: 'neutral' };
}

/**
 * Formate une date en format court
 * @param dateStr - Date ISO string
 * @param locale - Locale pour le formatage
 */
export function formatDate(dateStr: string, locale: string = 'en-US'): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formate une date avec l'heure
 * @param dateStr - Date ISO string
 * @param locale - Locale pour le formatage
 */
export function formatDateTime(dateStr: string, locale: string = 'en-US'): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formate un temps relatif (il y a X minutes)
 * @param dateStr - Date ISO string
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param value - Valeur numérique
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formate un nombre compact (1.2K, 3.5M)
 * @param value - Valeur numérique
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Formate une durée en secondes
 * @param seconds - Durée en secondes
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}
