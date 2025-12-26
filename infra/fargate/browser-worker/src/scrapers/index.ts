/**
 * OnlyFans Scrapers - Index
 * 
 * JSON Sniffing approach: Intercept API responses instead of parsing HTML
 * Much more reliable and budget-friendly than DOM scraping
 */

export { scrapeFinancials, type FinancialsResult, type PayoutStats, type ProfileStats } from './financials';
export { scrapeFans, type FansResult, type FanData } from './fans';
export { scrapeContentStats, type ContentStatsResult, type PostStats } from './content-stats';

// Action types for the worker
export type ScraperAction = 
  | 'scrape_financials'
  | 'scrape_fans' 
  | 'scrape_content';

// Combined result type
export type ScraperResult = 
  | import('./financials').FinancialsResult
  | import('./fans').FansResult
  | import('./content-stats').ContentStatsResult;
