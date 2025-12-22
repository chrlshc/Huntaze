import tipsData from './butler-tips-data.json';

export const BUTLER_TIPS = tipsData as Record<string, string[]>;

export type PageName = 'Home' | 'Analytics' | 'OnlyFans' | 'Marketing' | 'Content' | 'Settings' | 'Integrations' | 'Automations';

/**
 * Get a random tip for a specific page
 */
export function getRandomTip(page: PageName): string {
  const tips = BUTLER_TIPS[page];
  if (!tips || tips.length === 0) return "";
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Get a time-based tip that changes hourly (stable for 1 hour)
 * This ensures all users see the same tip during the same hour
 */
export function getTimeTip(page: PageName, date: Date = new Date()): string {
  const tips = BUTLER_TIPS[page];
  if (!tips || tips.length === 0) return "";

  // Create a seed based on year, day of year, and hour
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const seed = date.getFullYear() * 1_000_000 + dayOfYear * 100 + date.getHours();

  return tips[seed % tips.length];
}
