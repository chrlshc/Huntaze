/**
 * Client pour appeler le OF Scraper Worker sur AWS App Runner
 */

const WORKER_URL = process.env.OF_SCRAPER_WORKER_URL || 'http://localhost:8080';

interface ScrapeRequest {
  cookies: string;
  userAgent?: string;
  endpoint: string;
  proxyUrl?: string;
}

interface ScrapeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function scrapeOnlyFans<T = unknown>(
  request: ScrapeRequest
): Promise<ScrapeResponse<T>> {
  try {
    const response = await fetch(`${WORKER_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cookies: request.cookies,
        userAgent: request.userAgent,
        proxyUrl: request.proxyUrl || process.env.ONLYFANS_PROXY_URL,
        endpoint: request.endpoint
      })
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Endpoints courants
export const OF_ENDPOINTS = {
  ME: '/api2/v2/users/me',
  SUBSCRIBERS: '/api2/v2/subscriptions/subscribers',
  EARNINGS: '/api2/v2/earnings',
  MESSAGES: '/api2/v2/chats',
  STATISTICS: '/api2/v2/users/me/stats'
} as const;

// Helper functions
export async function getMyProfile(cookies: string) {
  return scrapeOnlyFans({ cookies, endpoint: OF_ENDPOINTS.ME });
}

export async function getSubscribers(cookies: string) {
  return scrapeOnlyFans({ cookies, endpoint: OF_ENDPOINTS.SUBSCRIBERS });
}

export async function getEarnings(cookies: string) {
  return scrapeOnlyFans({ cookies, endpoint: OF_ENDPOINTS.EARNINGS });
}

export async function getMessages(cookies: string) {
  return scrapeOnlyFans({ cookies, endpoint: OF_ENDPOINTS.MESSAGES });
}

export async function getStatistics(cookies: string) {
  return scrapeOnlyFans({ cookies, endpoint: OF_ENDPOINTS.STATISTICS });
}
