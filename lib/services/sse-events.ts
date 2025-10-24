import { broadcastToUser, broadcastToAll, ContentCreationEvent } from '@/app/api/content-creation/events/route';
import { MediaAsset, PPVCampaign, ScheduleEntry } from '@/src/lib/api/schemas';

// Event emitter service for Content Creation SSE events
export class ContentCreationEventEmitter {
  // Asset events
  static emitAssetUploaded(userId: string, asset: MediaAsset) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `asset-uploaded-${asset.id}-${Date.now()}`,
      type: 'asset_uploaded',
      data: asset,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitAssetProcessed(userId: string, assetId: string, status: 'success' | 'failed', result?: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `asset-processed-${assetId}-${Date.now()}`,
      type: 'asset_processed',
      data: {
        assetId,
        status,
        result,
        processedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitAssetUpdated(userId: string, asset: MediaAsset) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `asset-updated-${asset.id}-${Date.now()}`,
      type: 'asset_updated',
      data: asset,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitAssetDeleted(userId: string, assetId: string) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `asset-deleted-${assetId}-${Date.now()}`,
      type: 'asset_deleted',
      data: { id: assetId },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // Schedule events
  static emitScheduleUpdated(userId: string, scheduleEntry: ScheduleEntry) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `schedule-updated-${scheduleEntry.id}-${Date.now()}`,
      type: 'schedule_updated',
      data: scheduleEntry,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitScheduleDeleted(userId: string, scheduleEntryId: string) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `schedule-deleted-${scheduleEntryId}-${Date.now()}`,
      type: 'schedule_deleted',
      data: { id: scheduleEntryId },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // Campaign events
  static emitCampaignCreated(userId: string, campaign: PPVCampaign) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `campaign-created-${campaign.id}-${Date.now()}`,
      type: 'campaign_created',
      data: campaign,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitCampaignUpdated(userId: string, campaign: PPVCampaign) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `campaign-updated-${campaign.id}-${Date.now()}`,
      type: 'campaign_updated',
      data: campaign,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitCampaignMetrics(userId: string, campaignId: string, metrics: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `campaign-metrics-${campaignId}-${Date.now()}`,
      type: 'campaign_metrics',
      data: {
        campaignId,
        metrics,
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitCampaignStatus(userId: string, campaignId: string, status: string, details?: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `campaign-status-${campaignId}-${Date.now()}`,
      type: 'campaign_status',
      data: {
        campaignId,
        status,
        details,
        changedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // Compliance events
  static emitComplianceChecked(userId: string, assetId: string, compliance: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `compliance-checked-${assetId}-${Date.now()}`,
      type: 'compliance_checked',
      data: {
        assetId,
        compliance,
        checkedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // AI events
  static emitAIInsight(userId: string, insight: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `ai-insight-${Date.now()}`,
      type: 'ai_insight',
      data: insight,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  static emitAIRecommendation(userId: string, recommendation: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `ai-recommendation-${Date.now()}`,
      type: 'ai_recommendation',
      data: recommendation,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // Sync events
  static emitSyncConflict(userId: string, conflict: any) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `sync-conflict-${Date.now()}`,
      type: 'sync_conflict',
      data: conflict,
      timestamp: new Date().toISOString(),
    };
    
    broadcastToUser(userId, event);
  }

  // System-wide events (broadcast to all users)
  static emitSystemMaintenance(message: string, scheduledAt?: Date) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `system-maintenance-${Date.now()}`,
      type: 'ai_insight', // Reusing type for system messages
      data: {
        type: 'system_maintenance',
        message,
        scheduledAt: scheduledAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToAll(event);
  }

  static emitSystemUpdate(version: string, features: string[]) {
    const event: Omit<ContentCreationEvent, 'userId'> = {
      id: `system-update-${Date.now()}`,
      type: 'ai_insight', // Reusing type for system messages
      data: {
        type: 'system_update',
        version,
        features,
      },
      timestamp: new Date().toISOString(),
    };
    
    broadcastToAll(event);
  }
}

// Helper functions to integrate with existing API routes
export function triggerAssetEvents(userId: string, asset: MediaAsset, action: 'created' | 'updated' | 'deleted') {
  switch (action) {
    case 'created':
      ContentCreationEventEmitter.emitAssetUploaded(userId, asset);
      break;
    case 'updated':
      ContentCreationEventEmitter.emitAssetUpdated(userId, asset);
      break;
    case 'deleted':
      ContentCreationEventEmitter.emitAssetDeleted(userId, asset.id);
      break;
  }
}

export function triggerCampaignEvents(userId: string, campaign: PPVCampaign, action: 'created' | 'updated') {
  switch (action) {
    case 'created':
      ContentCreationEventEmitter.emitCampaignCreated(userId, campaign);
      break;
    case 'updated':
      ContentCreationEventEmitter.emitCampaignUpdated(userId, campaign);
      break;
  }
}

export function triggerScheduleEvents(userId: string, scheduleEntry: ScheduleEntry, action: 'created' | 'updated' | 'deleted') {
  switch (action) {
    case 'created':
    case 'updated':
      ContentCreationEventEmitter.emitScheduleUpdated(userId, scheduleEntry);
      break;
    case 'deleted':
      ContentCreationEventEmitter.emitScheduleDeleted(userId, scheduleEntry.id);
      break;
  }
}

// Background job simulation for processing events
export class BackgroundProcessor {
  static async processAssetCompliance(userId: string, assetId: string) {
    // Simulate compliance check delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Mock compliance result
    const compliance = {
      status: Math.random() > 0.1 ? 'approved' : 'rejected',
      checkedAt: new Date(),
      violations: Math.random() > 0.1 ? [] : ['inappropriate_content'],
      score: Math.floor(Math.random() * 100),
    };
    
    ContentCreationEventEmitter.emitComplianceChecked(userId, assetId, compliance);
  }

  static async processCampaignMetrics(userId: string, campaignId: string) {
    // Simulate metrics calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const metrics = {
      sent: Math.floor(Math.random() * 1000),
      opened: Math.floor(Math.random() * 800),
      purchased: Math.floor(Math.random() * 200),
      revenue: Math.floor(Math.random() * 5000),
      updatedAt: new Date(),
    };
    
    ContentCreationEventEmitter.emitCampaignMetrics(userId, campaignId, metrics);
  }

  static async generateAIInsights(userId: string) {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const insights = [
      {
        type: 'performance',
        title: 'Content Performance Insight',
        message: 'Your photo content performs 23% better on weekends',
        confidence: 0.87,
        actionable: true,
        suggestions: ['Schedule more photo content for weekends', 'Consider weekend-specific campaigns'],
      },
      {
        type: 'pricing',
        title: 'Pricing Optimization',
        message: 'Consider increasing PPV prices by 15% based on engagement',
        confidence: 0.92,
        actionable: true,
        suggestions: ['Test $30 price point', 'Create premium tier content'],
      },
    ];
    
    insights.forEach(insight => {
      ContentCreationEventEmitter.emitAIInsight(userId, insight);
    });
  }
}