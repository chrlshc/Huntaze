/**
 * Dashboard Date Utilities
 * 
 * Fonctions utilitaires pour la gestion des périodes et dates.
 * Feature: creator-analytics-dashboard
 */

import type { DateRange, DateRangePreset } from './types';

/**
 * Labels pour les presets de période
 */
export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '12m': 'Last 12 months',
};

/**
 * Convertit une date en string ISO YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  return formatDateISO(date);
}

/**
 * Calcule la période de comparaison pour une période donnée
 * La période de comparaison a la même durée et se termine juste avant le début de la période sélectionnée
 * 
 * @param from Date de début (ISO YYYY-MM-DD)
 * @param to Date de fin (ISO YYYY-MM-DD)
 * @returns Objet avec les dates from et to de la période de comparaison
 */
export function getComparisonPeriod(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(from + 'T00:00:00Z');
  const toDate = new Date(to + 'T00:00:00Z');
  
  // Calculer la durée en jours (inclus les deux dates)
  const durationMs = toDate.getTime() - fromDate.getTime();
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1;
  
  // La période de comparaison se termine la veille du début de la période sélectionnée
  const comparisonTo = new Date(fromDate);
  comparisonTo.setUTCDate(comparisonTo.getUTCDate() - 1);
  
  // La période de comparaison commence durationDays jours avant (inclus)
  const comparisonFrom = new Date(comparisonTo);
  comparisonFrom.setUTCDate(comparisonFrom.getUTCDate() - (durationDays - 1));
  
  return {
    from: formatDateISO(comparisonFrom),
    to: formatDateISO(comparisonTo),
  };
}

/**
 * Sérialise un DateRange en paramètres URL
 * 
 * @param range DateRange à sérialiser
 * @returns Objet avec les paramètres URL
 */
export function serializeDateRange(range: DateRange): Record<string, string> {
  if (range.type === 'preset') {
    return { range: range.preset };
  } else {
    return {
      from: range.from,
      to: range.to,
    };
  }
}

/**
 * Parse les paramètres URL en DateRange
 * 
 * @param params Paramètres URL (URLSearchParams ou objet)
 * @returns DateRange ou null si invalide
 */
export function parseDateRange(
  params: URLSearchParams | Record<string, string | undefined>
): DateRange | null {
  const getParam = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    return params[key] ?? null;
  };
  
  const rangeParam = getParam('range');
  const fromParam = getParam('from');
  const toParam = getParam('to');
  
  // Si on a un preset
  if (rangeParam && isValidPreset(rangeParam)) {
    return {
      type: 'preset',
      preset: rangeParam as DateRangePreset,
    };
  }
  
  // Si on a from et to
  if (fromParam && toParam && isValidISODate(fromParam) && isValidISODate(toParam)) {
    return {
      type: 'custom',
      from: fromParam,
      to: toParam,
    };
  }
  
  return null;
}

/**
 * Convertit un preset en dates concrètes
 * 
 * @param preset Preset à convertir
 * @param referenceDate Date de référence (par défaut aujourd'hui)
 * @returns Objet avec from et to en ISO
 */
export function presetToDates(
  preset: DateRangePreset,
  referenceDate: Date = new Date()
): { from: string; to: string } {
  const to = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  ));
  
  const from = new Date(to);
  
  switch (preset) {
    case 'today':
      // from et to sont le même jour
      break;
    case '7d':
      from.setUTCDate(from.getUTCDate() - 6); // 7 jours incluant aujourd'hui
      break;
    case '30d':
      from.setUTCDate(from.getUTCDate() - 29); // 30 jours incluant aujourd'hui
      break;
    case '12m':
      from.setUTCMonth(from.getUTCMonth() - 12);
      from.setUTCDate(from.getUTCDate() + 1); // Ajuster pour avoir exactement 12 mois
      break;
  }
  
  return {
    from: formatDateISO(from),
    to: formatDateISO(to),
  };
}

/**
 * Calcule la durée en jours entre deux dates
 * 
 * @param from Date de début (ISO)
 * @param to Date de fin (ISO)
 * @returns Nombre de jours (inclus)
 */
export function getDurationDays(from: string, to: string): number {
  const fromDate = new Date(from + 'T00:00:00Z');
  const toDate = new Date(to + 'T00:00:00Z');
  
  const durationMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure les deux jours
}

/**
 * Formate une date en ISO YYYY-MM-DD (UTC)
 */
function formatDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Vérifie si une chaîne est un preset valide
 */
function isValidPreset(value: string): value is DateRangePreset {
  return ['today', '7d', '30d', '12m'].includes(value);
}

/**
 * Vérifie si une chaîne est une date ISO valide (YYYY-MM-DD)
 */
function isValidISODate(value: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === formatDateISO(date);
}

/**
 * Génère un tableau de dates entre from et to
 * 
 * @param from Date de début (ISO)
 * @param to Date de fin (ISO)
 * @returns Tableau de dates ISO
 */
export function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  
  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return dates;
}

/**
 * Vérifie si deux DateRange sont équivalents
 */
export function areDateRangesEqual(a: DateRange, b: DateRange): boolean {
  if (a.type !== b.type) return false;
  
  if (a.type === 'preset' && b.type === 'preset') {
    return a.preset === b.preset;
  }
  
  if (a.type === 'custom' && b.type === 'custom') {
    return a.from === b.from && a.to === b.to;
  }
  
  return false;
}
