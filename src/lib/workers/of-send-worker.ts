// OnlyFans Send Worker
// Processes message queue with rate limiting and error handling

import { ofQueue, type QueueMessage, type DmMessage, type CampaignMessage } from '@/lib/queue/of-queue';
import { DEFAULT_RATE_LIMITS } from '@/lib/types/onlyfans';
import { sessionManager } from '@/lib/of/session-manager';
import { sendOfMessage, browserWorkerPool } from './of-browser-worker';
import { proxyManager } from '@/lib/of/proxy-manager';

export interface WorkerStats {
  processed: number;
  succeeded: number;
  failed: number;
  errorRate: number;
  isRunning: boolean;
  lastRunAt?: Date;
}

class OfSendWorker {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private stats: WorkerStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errorRate: 0,
    isRunning: false
  };
  
  // Kill switches
  private killSwitches = new Map<string, boolean>(); // userId -> stopped
  private campaignKillSwitches = new Map<string, boolean>(); // campaignId -> stopped

  // Start the worker
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      console.log('Worker already running');
      return;
    }

    this.isRunning = true;
    this.stats.isRunning = true;
    console.log('Starting OF send worker...');

    this.intervalId = setInterval(async () => {
      await this.processBatch();
    }, intervalMs);

    // Process immediately
    this.processBatch();
  }

  // Stop the worker
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.stats.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    console.log('OF send worker stopped');
  }

  // Process a batch of messages
  private async processBatch(): Promise<void> {
    try {
      const messages = await ofQueue.dequeue(10);
      
      if (messages.length === 0) return;
      
      console.log(`Processing ${messages.length} messages...`);
      this.stats.lastRunAt = new Date();

      // Process messages in parallel with concurrency limit
      const results = await Promise.allSettled(
        messages.map(msg => this.processMessage(msg))
      );

      // Update stats
      results.forEach((result, index) => {
        this.stats.processed++;
        
        if (result.status === 'fulfilled' && result.value) {
          this.stats.succeeded++;
        } else {
          this.stats.failed++;
          const error = result.status === 'rejected' ? result.reason : 'Unknown error';
          console.error(`Message ${messages[index].id} failed:`, error);
        }
      });

      // Update error rate
      this.stats.errorRate = this.stats.processed > 0 
        ? (this.stats.failed / this.stats.processed) * 100 
        : 0;

      // Check campaign error thresholds
      await this.checkCampaignErrors(messages);

    } catch (error) {
      console.error('Worker batch processing error:', error);
    }
  }

  // Process individual message
  private async processMessage(message: QueueMessage): Promise<boolean> {
    // Check kill switches
    if (this.killSwitches.get(message.userId)) {
      await ofQueue.fail(message.id, 'User automation stopped');
      return false;
    }

    if (message.type === 'campaign') {
      const campaignData = message.data as CampaignMessage;
      if (this.campaignKillSwitches.get(campaignData.campaignId)) {
        await ofQueue.fail(message.id, 'Campaign stopped');
        return false;
      }
    }

    try {
      // Check if user has active session and doesn't need manual action
      const needsAction = await sessionManager.needsManualAction(message.userId);
      if (needsAction.required) {
        await ofQueue.fail(message.id, `Manual action required: ${needsAction.type}`);
        return false;
      }

      // Get proxy for this user
      const proxy = proxyManager.getProxyForUser(message.userId);
      
      // Route to appropriate handler
      let success = false;
      if (message.type === 'dm') {
        success = await this.sendDm(message.userId, message.data as DmMessage, proxy);
      } else {
        success = await this.sendCampaignMessage(message.userId, message.data as CampaignMessage, proxy);
      }

      if (success) {
        await ofQueue.complete(message.id);
        return true;
      } else {
        await ofQueue.fail(message.id, 'Send failed');
        return false;
      }

    } catch (error: any) {
      await ofQueue.fail(message.id, error.message || 'Unknown error');
      return false;
    }
  }

  // Send DM message using browser automation
  private async sendDm(userId: string, data: DmMessage, proxy?: any): Promise<boolean> {
    console.log(`Sending DM to conversation ${data.conversationId}:`, data.content.text);
    
    try {
      const result = await sendOfMessage(
        userId,
        {
          id: Date.now().toString(),
          conversationId: data.conversationId,
          content: data.content,
          timestamp: new Date()
        } as any
      );
      
      if (result.success) {
        console.log(`DM sent successfully: ${result.messageId}`);
        return true;
      } else {
        throw new Error(result.error || 'Failed to send DM');
      }
    } catch (error: any) {
      console.error('DM send error:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Authentication required')) {
        await sessionManager.updateSessionStatus(userId, {
          isActive: false,
          requiresAction: true
        });
      }
      
      throw error;
    }
  }

  // Send campaign message using browser automation
  private async sendCampaignMessage(userId: string, data: CampaignMessage, proxy?: any): Promise<boolean> {
    console.log(`Sending campaign message to ${data.platformUserId}`);
    
    try {
      // For campaigns, we send to the user's conversation
      // In a real implementation, we'd need to find/create the conversation first
      const result = await sendOfMessage(
        userId,
        {
          id: Date.now().toString(),
          conversationId: data.platformUserId, // This should be the conversation ID
          content: data.content,
          timestamp: new Date()
        } as any
      );
      
      if (result.success) {
        console.log(`Campaign message sent successfully: ${result.messageId}`);
        
        // Update campaign recipient status
        await this.updateCampaignRecipient(data.campaignId, data.recipientId, 'sent');
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to send campaign message');
      }
    } catch (error: any) {
      console.error('Campaign send error:', error);
      
      // Update recipient status as failed
      await this.updateCampaignRecipient(data.campaignId, data.recipientId, 'failed', error.message);
      
      throw error;
    }
  }
  
  // Update campaign recipient status (mock)
  private async updateCampaignRecipient(
    campaignId: string, 
    recipientId: string, 
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    // TODO: Update in database
    console.log(`Updated recipient ${recipientId} for campaign ${campaignId}: ${status}`);
  }

  // Check campaign error thresholds
  private async checkCampaignErrors(messages: QueueMessage[]): Promise<void> {
    const campaignErrors = new Map<string, number>();
    const campaignTotals = new Map<string, number>();

    messages.forEach(msg => {
      if (msg.type === 'campaign' && msg.attempts > 0) {
        const campaignId = (msg.data as CampaignMessage).campaignId;
        campaignErrors.set(campaignId, (campaignErrors.get(campaignId) || 0) + 1);
        campaignTotals.set(campaignId, (campaignTotals.get(campaignId) || 0) + 1);
      }
    });

    // Check error rates and stop campaigns if needed
    campaignErrors.forEach((errors, campaignId) => {
      const total = campaignTotals.get(campaignId) || 0;
      const errorRate = total > 0 ? errors / total : 0;
      
      if (errorRate > DEFAULT_RATE_LIMITS.campaign.errorThreshold) {
        console.error(`Campaign ${campaignId} error rate ${errorRate * 100}% exceeds threshold. Stopping.`);
        this.stopCampaign(campaignId);
      }
    });
  }

  // Cleanup on shutdown
  async cleanup(): Promise<void> {
    this.stop();
    await browserWorkerPool.closeAll();
  }

  // Kill switch methods
  stopUser(userId: string): void {
    this.killSwitches.set(userId, true);
    console.log(`Stopped automation for user ${userId}`);
  }

  resumeUser(userId: string): void {
    this.killSwitches.delete(userId);
    console.log(`Resumed automation for user ${userId}`);
  }

  stopCampaign(campaignId: string): void {
    this.campaignKillSwitches.set(campaignId, true);
    console.log(`Stopped campaign ${campaignId}`);
  }

  resumeCampaign(campaignId: string): void {
    this.campaignKillSwitches.delete(campaignId);
    console.log(`Resumed campaign ${campaignId}`);
  }

  // Get worker statistics
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats.processed = 0;
    this.stats.succeeded = 0;
    this.stats.failed = 0;
    this.stats.errorRate = 0;
  }
}

// Export singleton
export const ofSendWorker = new OfSendWorker();

// Start worker in development (in production, use separate process)
if (process.env.NODE_ENV === 'development' && process.env.START_WORKERS === 'true') {
  ofSendWorker.start();
}
