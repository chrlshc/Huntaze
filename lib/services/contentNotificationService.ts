import { query } from '../db';
import { sendEmail } from '../email/ses';

interface NotificationContent {
  id: string;
  user_id: string;
  user_email: string;
  text: string;
  scheduled_at: Date;
  platforms: string[];
}

export const contentNotificationService = {
  /**
   * Send notification 1 hour before scheduled publication
   */
  async sendPrePublicationNotification(content: NotificationContent): Promise<void> {
    try {
      const scheduledTime = new Date(content.scheduled_at);
      const formattedTime = scheduledTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const platformList = content.platforms.join(', ');
      const contentPreview = content.text.substring(0, 100) + (content.text.length > 100 ? '...' : '');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .preview-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Content Publishing Soon!</h1>
              <p>Your scheduled content will be published in 1 hour</p>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="label">Scheduled Time:</span> ${formattedTime}
              </div>
              <div class="info-row">
                <span class="label">Platforms:</span> ${platformList}
              </div>
              
              <div class="preview-box">
                <strong>Content Preview:</strong>
                <p>${contentPreview}</p>
              </div>

              <p>You still have time to make changes if needed:</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/content/edit/${content.id}" class="button">
                Edit Content
              </a>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/content/schedule/${content.id}" class="button" style="background: #dc3545;">
                Cancel Schedule
              </a>

              <div class="footer">
                <p>This is an automated notification from your Content Creation System</p>
                <p>If you don't want to receive these notifications, you can update your preferences in settings</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: content.user_email,
        subject: `⏰ Content Publishing in 1 Hour - ${platformList}`,
        htmlBody: emailHtml,
        textBody: `Your content is scheduled to be published in 1 hour.\n\nScheduled Time: ${formattedTime}\nPlatforms: ${platformList}\n\nContent Preview:\n${contentPreview}\n\nEdit: ${process.env.NEXT_PUBLIC_APP_URL}/content/edit/${content.id}\nCancel: ${process.env.NEXT_PUBLIC_APP_URL}/content/schedule/${content.id}`
      });

      console.log(`[Notification] Sent pre-publication notification for content ${content.id} to ${content.user_email}`);
    } catch (error) {
      console.error('[Notification] Error sending pre-publication notification:', error);
      throw error;
    }
  },

  /**
   * Send notification after successful publication
   */
  async sendPublicationSuccessNotification(content: NotificationContent, publishedUrls: Record<string, string>): Promise<void> {
    try {
      const platformLinks = Object.entries(publishedUrls)
        .map(([platform, url]) => `<li><strong>${platform}:</strong> <a href="${url}">${url}</a></li>`)
        .join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .links-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Content Published Successfully!</h1>
            </div>
            <div class="content">
              <p>Your content has been successfully published to the following platforms:</p>
              
              <div class="links-box">
                <ul>
                  ${platformLinks}
                </ul>
              </div>

              <p>You can now view your published content and track its performance in your analytics dashboard.</p>

              <div class="footer">
                <p>This is an automated notification from your Content Creation System</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: content.user_email,
        subject: '✅ Content Published Successfully',
        htmlBody: emailHtml,
        textBody: `Your content has been successfully published!\n\nPublished to:\n${Object.entries(publishedUrls).map(([p, u]) => `${p}: ${u}`).join('\n')}`
      });

      console.log(`[Notification] Sent publication success notification for content ${content.id}`);
    } catch (error) {
      console.error('[Notification] Error sending publication success notification:', error);
    }
  },

  /**
   * Send notification if publication fails
   */
  async sendPublicationFailureNotification(content: NotificationContent, error: string): Promise<void> {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .error-icon { font-size: 48px; margin-bottom: 10px; }
            .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="error-icon">❌</div>
              <h1>Content Publication Failed</h1>
            </div>
            <div class="content">
              <p>We encountered an issue while trying to publish your content.</p>
              
              <div class="error-box">
                <strong>Error Details:</strong>
                <p>${error}</p>
              </div>

              <p>Don't worry! Your content has been automatically rescheduled for 5 minutes from now. You can also manually reschedule or edit your content.</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/content/edit/${content.id}" class="button">
                Edit Content
              </a>

              <div class="footer">
                <p>If this issue persists, please contact support</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: content.user_email,
        subject: '❌ Content Publication Failed',
        htmlBody: emailHtml,
        textBody: `Failed to publish your content.\n\nError: ${error}\n\nYour content has been rescheduled for 5 minutes from now.\n\nEdit: ${process.env.NEXT_PUBLIC_APP_URL}/content/edit/${content.id}`
      });

      console.log(`[Notification] Sent publication failure notification for content ${content.id}`);
    } catch (error) {
      console.error('[Notification] Error sending publication failure notification:', error);
    }
  },

  /**
   * Check for content that needs pre-publication notifications
   * Should be called periodically (e.g., every minute)
   */
  async checkAndSendPrePublicationNotifications(): Promise<void> {
    try {
      // Find content scheduled for 1 hour from now (within a 2-minute window)
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const oneHourTwoMinutesFromNow = new Date(Date.now() + 62 * 60 * 1000);

      const result = await query(
        `SELECT 
          ci.id,
          ci.user_id,
          u.email as user_email,
          ci.text,
          ci.scheduled_at,
          COALESCE(
            array_agg(cp.platform) FILTER (WHERE cp.platform IS NOT NULL),
            ARRAY[]::text[]
          ) as platforms
        FROM content_items ci
        JOIN users u ON ci.user_id = u.id
        LEFT JOIN content_platforms cp ON ci.id = cp.content_id
        WHERE ci.status = 'scheduled'
          AND ci.scheduled_at >= $1
          AND ci.scheduled_at <= $2
          AND ci.metadata->>'notification_sent' IS NULL
        GROUP BY ci.id, u.email`,
        [oneHourFromNow, oneHourTwoMinutesFromNow]
      );

      for (const content of result.rows) {
        await this.sendPrePublicationNotification(content);

        // Mark notification as sent
        await query(
          `UPDATE content_items 
           SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{notification_sent}', 'true')
           WHERE id = $1`,
          [content.id]
        );
      }

      if (result.rows.length > 0) {
        console.log(`[Notification] Sent ${result.rows.length} pre-publication notifications`);
      }
    } catch (error) {
      console.error('[Notification] Error checking for pre-publication notifications:', error);
    }
  }
};
