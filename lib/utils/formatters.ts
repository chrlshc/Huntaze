// Number formatting utilities following Shopify/Stripe standards

/**
 * Format number with space as thousand separator (European style)
 * @example formatNumber(12847) => "12 847"
 */
export function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format currency with proper symbol placement
 * @example formatCurrency(2250, 'EUR') => "€2 250"
 * @example formatCurrency(2250, 'USD') => "$2 250"
 */
export function formatCurrency(value: number, currency: 'EUR' | 'USD' = 'EUR'): string {
  const formatted = formatNumber(value);
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${formatted}`;
}

/**
 * Format percentage without decimals for cleaner look
 * @example formatPercent(15.0) => "15%"
 * @example formatPercent(32.5) => "33%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format with period suffix
 * @example formatWithPeriod(2250, 'mo') => "€2 250/mo"
 */
export function formatWithPeriod(value: number, period: 'mo' | 'yr', currency: 'EUR' | 'USD' = 'EUR'): string {
  return `${formatCurrency(value, currency)}/${period}`;
}

/**
 * Format large numbers with abbreviation
 * @example formatLargeNumber(5000) => "5K"
 * @example formatLargeNumber(2300000) => "2.3M"
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return formatNumber(value);
}

/**
 * Format time saved
 * @example formatTimeSaved(20) => "20+ hrs"
 */
export function formatTimeSaved(hours: number): string {
  return `${hours}+ hrs`;
}

/**
 * Format ROI with reasonable bounds
 * @example formatROI(2847) => "2 800%"
 */
export function formatROI(value: number): string {
  // Cap extreme values for credibility
  const capped = Math.min(value, 5000);
  return `${formatNumber(capped)}%`;
}