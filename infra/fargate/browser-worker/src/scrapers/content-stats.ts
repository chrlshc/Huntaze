/**
 * OnlyFans Content/Posts Stats Scraper
 * Captures post performance metrics via API interception
 * 
 * Lower priority for beta - but useful for content analytics
 */

import type { Page, Response } from 'playwright';

export interface PostStats {
  id: string;
  text?: string;
  postedAt?: string;
  likesCount?: number;
  commentsCount?: number;
  tipsSum?: number;
  viewsCount?: number;
  price?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  mediaCount?: number;
  raw?: any;
}

export interface ContentStatsResult {
  type: 'content_stats';
  count: number;
  posts: PostStats[];
  hasMore: boolean;
  timestamp: string;
  success: boolean;
  error?: string;
}

const POSTS_API_PATTERNS = [
  '/api2/v2/users/me/posts',
  '/api2/v2/posts',
];

export async function scrapeContentStats(
  page: Page,
  options: { maxCount?: number } = {}
): Promise<ContentStatsResult> {
  const { maxCount = 50 } = options;
  
  console.info(`[SCRAPE_CONTENT] Starting... (limit: ${maxCount})`);
  
  const postsData: PostStats[] = [];
  const seenIds = new Set<string>();

  const handleResponse = async (response: Response) => {
    const url = response.url();
    
    const isTargetUrl = POSTS_API_PATTERNS.some(pattern => url.includes(pattern));
    if (!isTargetUrl || response.status() !== 200) return;

    try {
      const json = await response.json();
      
      let posts: any[] = [];
      if (Array.isArray(json)) {
        posts = json;
      } else if (json.list && Array.isArray(json.list)) {
        posts = json.list;
      }

      for (const post of posts) {
        const id = String(post.id || '');
        if (!id || seenIds.has(id)) continue;
        
        seenIds.add(id);
        
        const stats: PostStats = {
          id,
          text: post.text || post.rawText || undefined,
          postedAt: post.postedAt || post.createdAt || undefined,
          likesCount: post.likesCount || post.likes || 0,
          commentsCount: post.commentsCount || post.comments || 0,
          tipsSum: post.tipsSum || post.tips || 0,
          viewsCount: post.viewsCount || post.views || undefined,
          price: post.price || undefined,
          isPinned: post.isPinned || false,
          isArchived: post.isArchived || false,
          mediaCount: post.media?.length || post.mediaCount || 0,
          raw: post,
        };
        
        postsData.push(stats);
      }
      
      console.info(`[SCRAPE_CONTENT] 📥 Batch. Total: ${postsData.length} posts`);
    } catch (e) {
      console.warn('[SCRAPE_CONTENT] Failed to parse response');
    }
  };

  page.on('response', handleResponse);

  try {
    console.info('[SCRAPE_CONTENT] Navigating to posts...');
    await page.goto('https://onlyfans.com/my/posts', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Limited scroll for budget
    let scrollAttempts = 0;
    const maxScrolls = 3;

    while (postsData.length < maxCount && scrollAttempts < maxScrolls) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      scrollAttempts++;
    }

  } catch (e: any) {
    console.error('[SCRAPE_CONTENT] Error:', e.message);
  } finally {
    page.removeListener('response', handleResponse);
  }

  const trimmedPosts = postsData.slice(0, maxCount);

  return {
    type: 'content_stats',
    count: trimmedPosts.length,
    posts: trimmedPosts,
    hasMore: postsData.length > maxCount,
    timestamp: new Date().toISOString(),
    success: trimmedPosts.length > 0,
    error: trimmedPosts.length === 0 ? 'No posts captured' : undefined,
  };
}
