import { query } from '../db';
import { contentNotificationService } from '../services/contentNotificationService';

interface ScheduledContent {
  id: string;
  user_id: string;
  text: string;
  scheduled_at: Date;
  platforms: string[];
}

export class ContentSchedulingWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the scheduling worker
   * Checks every minute for content due for publication
   */
  start() {
    if (this.isRunning) {
      console.log('Content scheduling worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting content scheduling worker...');

    // Run immediately on start
    this.checkScheduledContent();

    // Then run every minute
    this.intervalId = setInterval(() => {
      this.checkScheduledContent();
    }, 60 * 1000); // 60 seconds
  }

  /**
   * Stop the scheduling worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Content scheduling worker stopped');
  }

  /**
   * Check for content that needs to be published
   */
  private async checkScheduledContent() {
    try {
      console.log('[Scheduling Worker] Checking for scheduled content...');

      // Check for pre-publication notifications (1 hour before)
      await contentNotificationService.checkAndSendPrePublicationNotifications();

      // Find content scheduled for publication (within the last minute)
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const result = await query(
        `SELECT 
          ci.id,
          ci.user_id,
          ci.text,
          ci.scheduled_at,
          COALESCE(
            array_agg(cp.platform) FILTER (WHERE cp.platform IS NOT NULL),
            ARRAY[]::text[]
          ) as platforms
        FROM content_items ci
        LEFT JOIN content_platforms cp ON ci.id = cp.content_id
        WHERE ci.status = 'scheduled'
          AND ci.scheduled_at <= $1
          AND ci.scheduled_at > $2
        GROUP BY ci.id`,
        [now, oneMinuteAgo]
      );

      const scheduledContent: ScheduledContent[] = result.rows;

      if (scheduledContent.length > 0) {
        console.log(`[Scheduling Worker] Found ${scheduledContent.length} content items to publish`);

        for (const content of scheduledContent) {
          await this.publishContent(content);
        }
      } else {
        console.log('[Scheduling Worker] No content due for publication');
      }
    } catch (error) {
      console.error('[Scheduling Worker] Error checking scheduled content:', error);
    }
  }

  /**
   * Publish content to selected platforms
   */
  private async publishContent(content: ScheduledContent) {
    console.log(`[Scheduling Worker] Publishing content ${content.id} to platforms:`, content.platforms);

    try {
      // Update content status to publishing
      await query(
        `UPDATE content_items 
         SET status = 'publishing', updated_at = NOW()
         WHERE id = $1`,
        [content.id]
      );

      // Publish to each platform
      const publishResults = await Promise.allSettled(
        content.platforms.map(platform => this.publishToPlatform(content, platform))
      );

      // Check if all publications succeeded
      const allSucceeded = publishResults.every(result => result.status === 'fulfilled');

      if (allSucceeded) {
        // Update content status to published
        await query(
          `UPDATE content_items 
           SET status = 'published', 
               published_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [content.id]
        );

        console.log(`[Scheduling Worker] Successfully published content ${content.id}`);
      } else {
        // Some publications failed, update status to failed
        await query(
          `UPDATE content_items 
           SET status = 'failed', updated_at = NOW()
           WHERE id = $1`,
          [content.id]
        );

        console.error(`[Scheduling Worker] Failed to publish content ${content.id}`);
      }
    } catch (error) {
      console.error(`[Scheduling Worker] Error publishing content ${content.id}:`, error);

      // Update status to failed with retry
      await query(
        `UPDATE content_items 
         SET status = 'failed', updated_at = NOW()
         WHERE id = $1`,
        [content.id]
      );

      // Schedule retry (optional - could implement retry logic here)
      await this.scheduleRetry(content);
    }
  }

  /**
   * Publish content to a specific platform
   */
  private async publishToPlatform(content: ScheduledContent, platform: string): Promise<void> {
    console.log(`[Scheduling Worker] Publishing to ${platform}...`);

    try {
      // This is where you would integrate with actual platform APIs
      // For now, we'll simulate the publication
      
      // Example: Call platform-specific publish service
      // await instagramPublish.publish(content);
      // await twitterPublish.publish(content);
      // etc.

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update platform-specific data
      await query(
        `UPDATE content_platforms 
         SET published_at = NOW(),
             published_url = $1
         WHERE content_id = $2 AND platform = $3`,
        [`https://${platform}.com/post/${content.id}`, content.id, platform]
      );

      console.log(`[Scheduling Worker] Successfully published to ${platform}`);
    } catch (error) {
      console.error(`[Scheduling Worker] Error publishing to ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Schedule a retry for failed publication
   */
  private async scheduleRetry(content: ScheduledContent) {
    try {
      // Reschedule for 5 minutes from now
      const retryTime = new Date(Date.now() + 5 * 60 * 1000);

      await query(
        `UPDATE content_items 
         SET status = 'scheduled',
             scheduled_at = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [retryTime, content.id]
      );

      console.log(`[Scheduling Worker] Scheduled retry for content ${content.id} at ${retryTime}`);
    } catch (error) {
      console.error(`[Scheduling Worker] Error scheduling retry:`, error);
    }
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startedAt: this.intervalId ? new Date() : null
    };
  }
}

// Export singleton instance
export const contentSchedulingWorker = new ContentSchedulingWorker();
