/**
 * Dashboard Calculations
 * 
 * Fonctions de calcul pour les KPIs du dashboard.
 * Feature: creator-analytics-dashboard
 */

import type { TimeSeriesPoint, RevenueBreakdown } from './types';

/**
 * Données de revenus pour le calcul du Net Revenue
 */
export interface RevenueData {
  subscriptions: number;
  ppv: number;
  tips: number;
  customs: number;
  refunds: number;
  chargebacks: number;
  fees: number;
}

/**
 * Calcule le revenu net
 * Net Revenue = Subscriptions + PPV + Tips + Customs - Refunds - Chargebacks - Fees
 */
export function calculateNetRevenue(data: RevenueData): number {
  return (
    data.subscriptions +
    data.ppv +
    data.tips +
    data.customs -
    data.refunds -
    data.chargebacks -
    data.fees
  );
}

/**
 * Calcule le taux de conversion
 * Conversion Rate = (NewSubs / LinkTaps) * 100
 * @returns Pourcentage ou null si linkTaps = 0
 */
export function calculateConversionRate(newSubs: number, linkTaps: number): number | null {
  if (linkTaps === 0) return null;
  return (newSubs / linkTaps) * 100;
}

/**
 * Calcule la Lifetime Value
 * LTV = TotalRevenue / UniquePayingFans
 * @returns LTV ou null si uniqueFans = 0
 */
export function calculateLTV(totalRevenue: number, uniqueFans: number): number | null {
  if (uniqueFans === 0) return null;
  return totalRevenue / uniqueFans;
}

/**
 * Calcule le Revenue Per Message
 * RPM = AttributedRevenue / MessagesSent
 * @returns RPM ou null si messagesSent = 0
 */
export function calculateRPM(attributedRevenue: number, messagesSent: number): number | null {
  if (messagesSent === 0) return null;
  return attributedRevenue / messagesSent;
}

/**
 * Calcule le delta en pourcentage entre deux valeurs
 * @returns Pourcentage de changement ou null si previousValue = 0
 */
export function calculateDeltaPct(currentValue: number, previousValue: number): number | null {
  if (previousValue === 0) return null;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Calcule le drop-off entre deux étapes du funnel
 * @returns Pourcentage de drop-off ou null si previousStage = 0
 */
export function calculateDropOff(previousStage: number, currentStage: number): number | null {
  if (previousStage === 0) return null;
  return ((previousStage - currentStage) / previousStage) * 100;
}

/**
 * Convertit des données daily en cumulative
 */
export function toCumulative(data: TimeSeriesPoint[]): TimeSeriesPoint[] {
  let cumulative = 0;
  return data.map((point) => {
    cumulative += point.value;
    return { date: point.date, value: cumulative };
  });
}

/**
 * Calcule le total d'un breakdown de revenus
 */
export function calculateBreakdownTotal(breakdown: Omit<RevenueBreakdown, 'total'>): number {
  return breakdown.subscriptions + breakdown.ppv + breakdown.tips + breakdown.customs;
}

/**
 * Agrège les vues de toutes les plateformes
 */
export function aggregatePlatformViews(
  platforms: Array<{ views: number }>
): number {
  return platforms.reduce((sum, p) => sum + p.views, 0);
}

/**
 * Trie et retourne les top N contenus par newSubs
 */
export function getTopContentByNewSubs<T extends { newSubs: number }>(
  content: T[],
  limit: number = 3
): T[] {
  return [...content]
    .sort((a, b) => b.newSubs - a.newSubs)
    .slice(0, limit);
}
