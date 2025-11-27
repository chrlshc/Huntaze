/**
 * Duplicate Request Detection
 * Tracks API calls per page load to identify duplicate requests
 */

export interface DuplicateRequest {
  endpoint: string;
  count: number;
  pages: string[];
  potentialSavings: number; // ms
  timestamps: Date[];
}

export interface RequestStats {
  totalRequests: number;
  uniqueEndpoints: number;
  duplicateRequests: DuplicateRequest[];
  requestsByPage: Map<string, string[]>;
}

interface RequestRecord {
  endpoint: string;
  page: string;
  timestamp: Date;
  duration: number;
}

class RequestTracker {
  private requests: RequestRecord[] = [];
  private enabled: boolean = false;
  private currentPage: string = '';

  enable() {
    this.enabled = true;
    this.requests = [];
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setCurrentPage(page: string) {
    this.currentPage = page;
  }

  trackRequest(endpoint: string, duration: number = 0) {
    if (!this.enabled) return;

    this.requests.push({
      endpoint,
      page: this.currentPage || 'unknown',
      timestamp: new Date(),
      duration,
    });
  }

  getStats(): RequestStats {
    const totalRequests = this.requests.length;
    const uniqueEndpoints = new Set(this.requests.map((r) => r.endpoint)).size;

    // Group requests by endpoint
    const requestsByEndpoint = new Map<string, RequestRecord[]>();
    this.requests.forEach((r) => {
      const existing = requestsByEndpoint.get(r.endpoint) || [];
      existing.push(r);
      requestsByEndpoint.set(r.endpoint, existing);
    });

    // Find duplicates (same endpoint called multiple times)
    const duplicateRequests: DuplicateRequest[] = [];
    requestsByEndpoint.forEach((records, endpoint) => {
      if (records.length > 1) {
        const pages = [...new Set(records.map((r) => r.page))];
        const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
        const avgDuration = totalDuration / records.length;
        const potentialSavings = avgDuration * (records.length - 1);

        duplicateRequests.push({
          endpoint,
          count: records.length,
          pages,
          potentialSavings,
          timestamps: records.map((r) => r.timestamp),
        });
      }
    });

    // Sort by potential savings
    duplicateRequests.sort((a, b) => b.potentialSavings - a.potentialSavings);

    // Group requests by page
    const requestsByPage = new Map<string, string[]>();
    this.requests.forEach((r) => {
      const existing = requestsByPage.get(r.page) || [];
      existing.push(r.endpoint);
      requestsByPage.set(r.page, existing);
    });

    return {
      totalRequests,
      uniqueEndpoints,
      duplicateRequests,
      requestsByPage,
    };
  }

  getRequests(): RequestRecord[] {
    return [...this.requests];
  }

  reset() {
    this.requests = [];
    this.currentPage = '';
  }

  // Get requests for a specific page
  getRequestsForPage(page: string): RequestRecord[] {
    return this.requests.filter((r) => r.page === page);
  }

  // Check if an endpoint is called multiple times on the same page
  isDuplicateOnPage(endpoint: string, page: string): boolean {
    const pageRequests = this.getRequestsForPage(page);
    return pageRequests.filter((r) => r.endpoint === endpoint).length > 1;
  }
}

// Singleton instance
export const requestTracker = new RequestTracker();

/**
 * Fetch wrapper that tracks requests
 */
export async function trackedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const start = performance.now();

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;
    requestTracker.trackRequest(url, duration);
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    requestTracker.trackRequest(url, duration);
    throw error;
  }
}
