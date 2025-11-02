/**
 * Webhook Worker
 * 
 * Background worker that processes queued webhook events:
 * - Processes pending events from webhook_events table
 * - Retries failed events with exponential backoff
 * - Updates post statuses based on webhook data
 * - Handles duplicate events (idempotence)
 * 
 * Can be run as:
 * - Cron job (every 1-5 minutes)
 * - AWS Lambda scheduled function
 * - Node.js background process
 */

import { webhookProcessor } from '@/lib/services/webhookProcessor';

export interface WebhookWorkerConfig {
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class WebhookWorker {
  private config: Required<WebhookWorkerConfig>;
  private isRunning: boolean = false;

  constructor(config: WebhookWorkerConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
    };
  }

  /**
   * Process pending webhook events
   * 
   * @returns Number of events processed
   */
  async processPendingEvents(): Promise<number> {
    if (this.isRunning) {
      console.log('Webhook worker already running, skipping');
      return 0;
    }

    this.isRunning = true;
    let processed = 0;

    try {
      console.log('Webhook worker started');

      // Get pending events
      const events = await webhookProcessor.getPendingEvents(this.config.batchSize);

      if (events.length === 0) {
        console.log('No pending webhook events');
        return 0;
      }

      console.log(`Processing ${events.length} pending webhook events`);

      // Process each event
      for (const event of events) {
        try {
          // Calculate exponential backoff delay
          const delay = this.calculateBackoffDelay(event.retry_count);
          
          if (delay > 0) {
            console.log(`Waiting ${delay}ms before retrying event ${event.id}`);
            await this.sleep(delay);
          }

          // Process event
          const result = await webhookProcessor.processEvent({
            provider: event.provider,
            eventType: event.event_type,
            externalId: event.external_id,
            payload: event.payload_json,
          });

          if (result.processed) {
            processed++;
            console.log(`Event ${event.id} processed successfully`);
          } else if (result.duplicate) {
            console.log(`Event ${event.id} is duplicate, skipped`);
          }
        } catch (error) {
          console.error(`Failed to process event ${event.id}:`, error);
          
          // Event will be retried on next worker run
          // Error is already logged in webhookProcessor
        }
      }

      console.log(`Webhook worker completed: ${processed}/${events.length} events processed`);
      return processed;
    } catch (error) {
      console.error('Webhook worker error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Calculate exponential backoff delay
   * 
   * @param retryCount - Number of retries
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(retryCount: number): number {
    if (retryCount === 0) {
      return 0;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    const baseDelay = this.config.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    
    // Cap at 60 seconds
    return Math.min(exponentialDelay, 60000);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run worker continuously with interval
   * Useful for development or standalone process
   * 
   * @param intervalMs - Interval between runs (default: 60000ms = 1 minute)
   */
  async runContinuously(intervalMs: number = 60000): Promise<void> {
    console.log(`Webhook worker running continuously (interval: ${intervalMs}ms)`);

    while (true) {
      try {
        await this.processPendingEvents();
      } catch (error) {
        console.error('Webhook worker run failed:', error);
      }

      // Wait before next run
      await this.sleep(intervalMs);
    }
  }

  /**
   * Check if worker is currently running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const webhookWorker = new WebhookWorker();

/**
 * Run webhook worker once
 * Can be called from API endpoint or cron job
 */
export async function runWebhookWorker(): Promise<number> {
  return webhookWorker.processPendingEvents();
}

/**
 * Start webhook worker as continuous process
 * For development or standalone deployment
 */
export async function startWebhookWorker(intervalMs?: number): Promise<void> {
  return webhookWorker.runContinuously(intervalMs);
}
