/**
 * OnlyFans Fans/Subscribers Scraper
 * Uses JSON Sniffing + controlled infinite scroll
 * 
 * Budget-conscious: Limits pagination to avoid excessive data usage
 */

import type { Page, Response } from 'playwright';

export interface FanData {
  id: string;
  username?: string;
  name?: string;
  avatar?: string;
  subscribedAt?: string;
  expiredAt?: string;
  renewedAt?: string;
  subscribePrice?: number;
  totalSpent?: number;
  tipsSum?: number;
  messagesCount?: number;
  isBlocked?: boolean;
  isRestricted?: boolean;
  // Raw data from API
  raw?: any;
}

export interface FansResult {
  type: 'fans_list';
  count: number;
  fans: FanData[];
  hasMore: boolean;
  timestamp: string;
  success: boolean;
  error?: string;
}

// API endpoints for subscriber lists
const FANS_API_PATTERNS = [
  '/api2/v2/subscriptions/subscribers',  // Active subscribers
  '/api2/v2/users/list',                  // Generic user list
];

export async function scrapeFans(
  page: Page,
  options: {
    maxCount?: number;
    type?: 'active' | 'expired' | 'all';
  } = {}
): Promise<FansResult> {
  const { maxCount = 100, type = 'active' } = options;
  
  console.info(`[SCRAPE_FANS] Starting... (limit: ${maxCount}, type: ${type})`);
  
  const fansData: FanData[] = [];
  const seenIds = new Set<string>();

  // Response handler
  const handleResponse = async (response: Response) => {
    const url = response.url();
    
    const isTargetUrl = FANS_API_PATTERNS.some(pattern => url.includes(pattern));
    if (!isTargetUrl || response.status() !== 200) return;

    try {
      const json = await response.json();
      
      // Handle different response formats
      let users: any[] = [];
      
      if (Array.isArray(json)) {
        users = json;
      } else if (json.list && Array.isArray(json.list)) {
        users = json.list;
      } else if (json.users && Array.isArray(json.users)) {
        users = json.users;
      }

      for (const user of users) {
        const id = String(user.id || user.userId || '');
        if (!id || seenIds.has(id)) continue;
        
        seenIds.add(id);
        
        const fan: FanData = {
          id,
          username: user.username || user.name || undefined,
          name: user.name || user.username || undefined,
          avatar: user.avatar || user.avatarUrl || undefined,
          subscribedAt: user.subscribedAt || user.startDate || undefined,
          expiredAt: user.expiredAt || user.endDate || undefined,
          renewedAt: user.renewedAt || undefined,
          subscribePrice: user.subscribePrice || user.price || undefined,
          totalSpent: user.totalSpent || user.spent || undefined,
          tipsSum: user.tipsSum || user.tips || undefined,
          messagesCount: user.messagesCount || undefined,
          isBlocked: user.isBlocked || false,
          isRestricted: user.isRestricted || false,
          raw: user,
        };
        
        fansData.push(fan);
      }
      
      console.info(`[SCRAPE_FANS] 📥 Batch received. Total: ${fansData.length} fans`);
    } catch (e) {
      console.warn('[SCRAPE_FANS] Failed to parse response');
    }
  };

  // Attach listener
  page.on('response', handleResponse);

  try {
    // Navigate to subscribers page
    const pageUrl = type === 'expired' 
      ? 'https://onlyfans.com/my/subscribers/expired'
      : 'https://onlyfans.com/my/subscribers/active';
    
    console.info(`[SCRAPE_FANS] Navigating to ${pageUrl}...`);
    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for initial load
    await page.waitForTimeout(3000);

    // Controlled infinite scroll
    let previousCount = 0;
    let noChangeAttempts = 0;
    const maxNoChangeAttempts = 3;

    while (fansData.length < maxCount && noChangeAttempts < maxNoChangeAttempts) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Human-like delay
      await page.waitForTimeout(2000 + Math.random() * 1000);

      // Check if we got new data
      if (fansData.length === previousCount) {
        noChangeAttempts++;
        console.info(`[SCRAPE_FANS] No new data (attempt ${noChangeAttempts}/${maxNoChangeAttempts})`);
      } else {
        noChangeAttempts = 0;
        previousCount = fansData.length;
      }

      // Safety check
      if (fansData.length >= maxCount) {
        console.info(`[SCRAPE_FANS] Reached limit of ${maxCount}`);
        break;
      }
    }

  } catch (e: any) {
    console.error('[SCRAPE_FANS] Error:', e.message);
  } finally {
    page.removeListener('response', handleResponse);
  }

  // Trim to maxCount
  const trimmedFans = fansData.slice(0, maxCount);

  const result: FansResult = {
    type: 'fans_list',
    count: trimmedFans.length,
    fans: trimmedFans,
    hasMore: fansData.length > maxCount,
    timestamp: new Date().toISOString(),
    success: trimmedFans.length > 0,
    error: trimmedFans.length === 0 ? 'No fans data captured' : undefined,
  };

  console.info(`[SCRAPE_FANS] ✅ Complete. Captured ${result.count} fans`);
  return result;
}
