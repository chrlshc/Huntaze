/**
 * OnlyFans Financials Scraper
 * Uses JSON Sniffing technique - intercepts API responses instead of parsing HTML
 * 
 * Budget-friendly: Only 1 page load, captures all data from API responses
 */

import type { Page, Response } from 'playwright';

export interface PayoutStats {
  total_earnings?: number;
  current_balance?: number;
  pending_balance?: number;
  chargebacks?: number;
  referrals?: number;
  // Daily/monthly breakdowns
  earnings_by_period?: Array<{
    date: string;
    amount: number;
    type: 'subscription' | 'tip' | 'ppv' | 'referral';
  }>;
}

export interface ProfileStats {
  subscribers_count?: number;
  fans_count?: number;
  posts_count?: number;
  photos_count?: number;
  videos_count?: number;
  archived_posts_count?: number;
  likes_count?: number;
  tips_count?: number;
}

export interface FinancialsResult {
  type: 'financials';
  data: {
    payouts?: PayoutStats;
    profile_stats?: ProfileStats;
    raw_responses?: Record<string, any>;
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

// Target API endpoints that OnlyFans calls when loading the earnings page
const TARGET_URLS = [
  '/api2/v2/payouts/stats',      // Revenue data
  '/api2/v2/users/me/stats',     // Profile stats (subs, likes, etc.)
  '/api2/v2/earnings/chart',     // Earnings chart data
  '/api2/v2/payouts/summary',    // Payout summary
];

export async function scrapeFinancials(page: Page): Promise<FinancialsResult> {
  console.info('[SCRAPE_FINANCIALS] Starting...');
  
  const collectedData: Record<string, any> = {};
  const capturedUrls: string[] = [];

  // Response handler - captures JSON from target API endpoints
  const handleResponse = async (response: Response) => {
    const url = response.url();
    
    for (const targetUrl of TARGET_URLS) {
      if (url.includes(targetUrl) && response.status() === 200) {
        try {
          const data = await response.json();
          const key = targetUrl.split('/').pop() || 'unknown';
          collectedData[key] = data;
          capturedUrls.push(targetUrl);
          console.info(`[SCRAPE_FINANCIALS] ✅ Captured: ${key}`);
        } catch (e) {
          console.warn(`[SCRAPE_FINANCIALS] Failed to parse JSON from ${targetUrl}`);
        }
        break;
      }
    }
  };

  // Attach listener
  page.on('response', handleResponse);

  try {
    // Navigate to earnings stats page - this triggers all the API calls
    console.info('[SCRAPE_FINANCIALS] Navigating to earnings-stats...');
    await page.goto('https://onlyfans.com/my/statements/earnings-stats', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for API responses to come in
    await page.waitForTimeout(5000);

    // Optional: Click date filter to force refresh if needed
    try {
      const dateFilter = page.locator('text=/Last 30 days|This month/i').first();
      if (await dateFilter.isVisible({ timeout: 2000 })) {
        await dateFilter.click();
        await page.waitForTimeout(2000);
      }
    } catch {}

    // Also try to get the main stats page
    try {
      await page.goto('https://onlyfans.com/my/statistics', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await page.waitForTimeout(3000);
    } catch {}

  } catch (e: any) {
    console.error('[SCRAPE_FINANCIALS] Navigation error:', e.message);
  } finally {
    // Remove listener
    page.removeListener('response', handleResponse);
  }

  // Check if we got any data
  if (Object.keys(collectedData).length === 0) {
    return {
      type: 'financials',
      data: {},
      timestamp: new Date().toISOString(),
      success: false,
      error: 'No financial data captured - session may be invalid',
    };
  }

  // Parse and structure the data
  const result: FinancialsResult = {
    type: 'financials',
    data: {
      payouts: collectedData['stats'] || collectedData['summary'] || undefined,
      profile_stats: collectedData['stats'] || undefined,
      raw_responses: collectedData,
    },
    timestamp: new Date().toISOString(),
    success: true,
  };

  console.info(`[SCRAPE_FINANCIALS] ✅ Complete. Captured ${capturedUrls.length} endpoints`);
  return result;
}
