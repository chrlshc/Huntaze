/**
 * OF Scraper Module
 * 
 * Architecture async pour le scraping OnlyFans avec BullMQ.
 * 
 * Usage:
 * ```ts
 * import { enqueueScrapeJob, getJobStatus } from '@/lib/of-scraper';
 * 
 * // Enqueue a job (returns immediately)
 * const { jobId } = await enqueueScrapeJob('sync-profile', {
 *   userId: 123,
 *   endpoint: '/api2/v2/users/me',
 *   cookies: 'sess=xxx; auth_id=xxx',
 * });
 * 
 * // Check status later
 * const status = await getJobStatus(jobId);
 * ```
 */

export {
  enqueueScrapeJob,
  getJobStatus,
  waitForJob,
  getScraperQueue,
  OF_SCRAPE_ENDPOINTS,
} from './queue';

export type {
  ScrapeJobData,
  ScrapeJobResult,
  ScrapeJobType,
  JobStatusResponse,
} from './types';
