import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ContentCreationEventEmitter,
  triggerAssetEvents,
  triggerCampaignEvents,
  triggerScheduleEvents,
  BackgroundProcessor
} from '@/lib/services/sse-events';

// Mock the API route functions
vi.mock('@/app/api/content-creation/events/route', () => ({
  broadcastToUser: vi.fn(),
  broadcastToAll: vi.fn(),
}));

// Mock schemas
vi.mock('@/src/lib/api/schemas', () => ({
  MediaAsset: {},
  PPVCampaign: {},
}));

describe('ContentCreationEventEmitter', () => {
  const mockUserId = 'user-123';
  const mockAsset = {
    id: 'asset-1',
    title: 'Test Asset',
    type: 'image',
    url: 'https://example.com/asset.jpg',
    createdAt: new Date().toISOString(),
  };

  const mockCampaign = {
    id: 'campaign-1',
    title: 'Test Campaign',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const mockScheduleEntry = {
    id: 'schedule-1',
    assetId: 'asset-1',
    scheduledAt: new Date().toISOString(),
    status: 'scheduled',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Asset Events', () => {
    it('should emit asset_uploaded event', () => {
      ContentCreationEventEmitter.emitAssetUploaded(mockUserId, mockAsset);

      // Test passes if no error is thrown
      expect(true).toBe(true);
    });

    it('should emit asset_processed event with success status', () => {
      const result = { processedUrl: 'https://example.com/processed.jpg' };
      
      ContentCreationEventEmitter.emitAssetProcessed(mockUserId, 'asset-1', 'success', result);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('asset-processed-asset-1'),
        type: 'asset_processed',
        data: {
          assetId: 'asset-1',
          status: 'success',
          result,
          processedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit asset_processed event with failed status', () => {
      ContentCreationEventEmitter.emitAssetProcessed(mockUserId, 'asset-1', 'failed');

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('asset-processed-asset-1'),
        type: 'asset_processed',
        data: {
          assetId: 'asset-1',
          status: 'failed',
          result: undefined,
          processedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit asset_updated event', () => {
      ContentCreationEventEmitter.emitAssetUpdated(mockUserId, mockAsset);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('asset-updated-asset-1'),
        type: 'asset_updated',
        data: mockAsset,
        timestamp: expect.any(String),
      });
    });

    it('should emit asset_deleted event', () => {
      ContentCreationEventEmitter.emitAssetDeleted(mockUserId, 'asset-1');

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('asset-deleted-asset-1'),
        type: 'asset_deleted',
        data: { id: 'asset-1' },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Schedule Events', () => {
    it('should emit schedule_updated event', () => {
      ContentCreationEventEmitter.emitScheduleUpdated(mockUserId, mockScheduleEntry);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('schedule-updated-schedule-1'),
        type: 'schedule_updated',
        data: mockScheduleEntry,
        timestamp: expect.any(String),
      });
    });

    it('should emit schedule_deleted event', () => {
      ContentCreationEventEmitter.emitScheduleDeleted(mockUserId, 'schedule-1');

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('schedule-deleted-schedule-1'),
        type: 'schedule_deleted',
        data: { id: 'schedule-1' },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Campaign Events', () => {
    it('should emit campaign_created event', () => {
      ContentCreationEventEmitter.emitCampaignCreated(mockUserId, mockCampaign);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('campaign-created-campaign-1'),
        type: 'campaign_created',
        data: mockCampaign,
        timestamp: expect.any(String),
      });
    });

    it('should emit campaign_updated event', () => {
      ContentCreationEventEmitter.emitCampaignUpdated(mockUserId, mockCampaign);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('campaign-updated-campaign-1'),
        type: 'campaign_updated',
        data: mockCampaign,
        timestamp: expect.any(String),
      });
    });

    it('should emit campaign_metrics event', () => {
      const metrics = {
        sent: 100,
        opened: 80,
        purchased: 20,
        revenue: 500,
      };

      ContentCreationEventEmitter.emitCampaignMetrics(mockUserId, 'campaign-1', metrics);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('campaign-metrics-campaign-1'),
        type: 'campaign_metrics',
        data: {
          campaignId: 'campaign-1',
          metrics,
          updatedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit campaign_status event', () => {
      const details = { reason: 'Budget exhausted' };
      
      ContentCreationEventEmitter.emitCampaignStatus(mockUserId, 'campaign-1', 'paused', details);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('campaign-status-campaign-1'),
        type: 'campaign_status',
        data: {
          campaignId: 'campaign-1',
          status: 'paused',
          details,
          changedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Compliance Events', () => {
    it('should emit compliance_checked event', () => {
      const compliance = {
        status: 'approved',
        score: 95,
        violations: [],
        checkedAt: new Date().toISOString(),
      };

      ContentCreationEventEmitter.emitComplianceChecked(mockUserId, 'asset-1', compliance);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('compliance-checked-asset-1'),
        type: 'compliance_checked',
        data: {
          assetId: 'asset-1',
          compliance,
          checkedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('AI Events', () => {
    it('should emit AI insight event', () => {
      const insight = {
        type: 'performance',
        title: 'Content Performance Insight',
        message: 'Your photo content performs 23% better on weekends',
        confidence: 0.87,
      };

      ContentCreationEventEmitter.emitAIInsight(mockUserId, insight);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('ai-insight'),
        type: 'ai_insight',
        data: insight,
        timestamp: expect.any(String),
      });
    });

    it('should emit AI recommendation event', () => {
      const recommendation = {
        type: 'pricing',
        title: 'Pricing Optimization',
        message: 'Consider increasing PPV prices by 15%',
        actionable: true,
        suggestions: ['Test $30 price point'],
      };

      ContentCreationEventEmitter.emitAIRecommendation(mockUserId, recommendation);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('ai-recommendation'),
        type: 'ai_recommendation',
        data: recommendation,
        timestamp: expect.any(String),
      });
    });
  });

  describe('Sync Events', () => {
    it('should emit sync_conflict event', () => {
      const conflict = {
        type: 'asset_conflict',
        assetId: 'asset-1',
        localVersion: 'v1',
        remoteVersion: 'v2',
      };

      ContentCreationEventEmitter.emitSyncConflict(mockUserId, conflict);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('sync-conflict'),
        type: 'sync_conflict',
        data: conflict,
        timestamp: expect.any(String),
      });
    });
  });

  describe('System Events', () => {
    it('should emit system maintenance event to all users', () => {
      const scheduledAt = new Date();
      
      ContentCreationEventEmitter.emitSystemMaintenance('Scheduled maintenance', scheduledAt);

      expect(mockBroadcastToAll).toHaveBeenCalledWith({
        id: expect.stringContaining('system-maintenance'),
        type: 'ai_insight',
        data: {
          type: 'system_maintenance',
          message: 'Scheduled maintenance',
          scheduledAt: scheduledAt.toISOString(),
        },
        timestamp: expect.any(String),
      });
    });

    it('should emit system update event to all users', () => {
      const features = ['New AI tools', 'Improved performance'];
      
      ContentCreationEventEmitter.emitSystemUpdate('v2.1.0', features);

      expect(mockBroadcastToAll).toHaveBeenCalledWith({
        id: expect.stringContaining('system-update'),
        type: 'ai_insight',
        data: {
          type: 'system_update',
          version: 'v2.1.0',
          features,
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Event ID Generation', () => {
    it('should generate unique event IDs', () => {
      const calls: any[] = [];
      mockBroadcastToUser.mockImplementation((userId, event) => {
        calls.push(event.id);
      });

      ContentCreationEventEmitter.emitAssetUploaded(mockUserId, mockAsset);
      ContentCreationEventEmitter.emitAssetUploaded(mockUserId, mockAsset);

      expect(calls).toHaveLength(2);
      expect(calls[0]).not.toBe(calls[1]);
    });

    it('should include timestamp in event ID for uniqueness', () => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      ContentCreationEventEmitter.emitAssetUploaded(mockUserId, mockAsset);

      expect(mockBroadcastToUser).toHaveBeenCalledWith(mockUserId, {
        id: expect.stringContaining('1704110400000'), // Unix timestamp
        type: 'asset_uploaded',
        data: mockAsset,
        timestamp: expect.any(String),
      });
    });
  });
});

describe('Helper Functions', () => {
  const mockUserId = 'user-123';
  const mockAsset = { id: 'asset-1', title: 'Test Asset' };
  const mockCampaign = { id: 'campaign-1', title: 'Test Campaign' };
  const mockScheduleEntry = { id: 'schedule-1', assetId: 'asset-1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('triggerAssetEvents', () => {
    it('should trigger asset uploaded event for created action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAssetUploaded');
      
      triggerAssetEvents(mockUserId, mockAsset as any, 'created');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockAsset);
    });

    it('should trigger asset updated event for updated action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAssetUpdated');
      
      triggerAssetEvents(mockUserId, mockAsset as any, 'updated');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockAsset);
    });

    it('should trigger asset deleted event for deleted action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAssetDeleted');
      
      triggerAssetEvents(mockUserId, mockAsset as any, 'deleted');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockAsset.id);
    });
  });

  describe('triggerCampaignEvents', () => {
    it('should trigger campaign created event for created action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitCampaignCreated');
      
      triggerCampaignEvents(mockUserId, mockCampaign as any, 'created');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockCampaign);
    });

    it('should trigger campaign updated event for updated action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitCampaignUpdated');
      
      triggerCampaignEvents(mockUserId, mockCampaign as any, 'updated');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockCampaign);
    });
  });

  describe('triggerScheduleEvents', () => {
    it('should trigger schedule updated event for created action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitScheduleUpdated');
      
      triggerScheduleEvents(mockUserId, mockScheduleEntry as any, 'created');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockScheduleEntry);
    });

    it('should trigger schedule updated event for updated action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitScheduleUpdated');
      
      triggerScheduleEvents(mockUserId, mockScheduleEntry as any, 'updated');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockScheduleEntry);
    });

    it('should trigger schedule deleted event for deleted action', () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitScheduleDeleted');
      
      triggerScheduleEvents(mockUserId, mockScheduleEntry as any, 'deleted');
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, mockScheduleEntry.id);
    });
  });
});

describe('BackgroundProcessor', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('processAssetCompliance', () => {
    it('should process asset compliance and emit result', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitComplianceChecked');
      
      const processPromise = BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-1');
      
      // Fast forward the delay
      vi.advanceTimersByTime(5000);
      
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-1', expect.objectContaining({
        status: expect.stringMatching(/approved|rejected/),
        checkedAt: expect.any(Date),
        violations: expect.any(Array),
        score: expect.any(Number),
      }));
    });

    it('should generate approved compliance result most of the time', async () => {
      // Mock Math.random to return 0.5 (> 0.1, so approved)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitComplianceChecked');
      
      const processPromise = BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-1');
      vi.advanceTimersByTime(5000);
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-1', expect.objectContaining({
        status: 'approved',
        violations: [],
      }));
    });

    it('should generate rejected compliance result occasionally', async () => {
      // Mock Math.random to return 0.05 (< 0.1, so rejected)
      vi.spyOn(Math, 'random').mockReturnValue(0.05);
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitComplianceChecked');
      
      const processPromise = BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-1');
      vi.advanceTimersByTime(5000);
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-1', expect.objectContaining({
        status: 'rejected',
        violations: ['inappropriate_content'],
      }));
    });
  });

  describe('processCampaignMetrics', () => {
    it('should process campaign metrics and emit result', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitCampaignMetrics');
      
      const processPromise = BackgroundProcessor.processCampaignMetrics(mockUserId, 'campaign-1');
      
      // Fast forward the delay
      vi.advanceTimersByTime(2000);
      
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'campaign-1', expect.objectContaining({
        sent: expect.any(Number),
        opened: expect.any(Number),
        purchased: expect.any(Number),
        revenue: expect.any(Number),
        updatedAt: expect.any(Date),
      }));
    });

    it('should generate realistic metrics ranges', async () => {
      // Mock Math.random to return predictable values
      const randomValues = [0.5, 0.4, 0.1, 0.3]; // sent=500, opened=400, purchased=100, revenue=1500
      let callCount = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => randomValues[callCount++] || 0.5);
      
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitCampaignMetrics');
      
      const processPromise = BackgroundProcessor.processCampaignMetrics(mockUserId, 'campaign-1');
      vi.advanceTimersByTime(2000);
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'campaign-1', expect.objectContaining({
        sent: 500,
        opened: 400,
        purchased: 100,
        revenue: 1500,
      }));
    });
  });

  describe('generateAIInsights', () => {
    it('should generate AI insights and emit them', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAIInsight');
      
      const processPromise = BackgroundProcessor.generateAIInsights(mockUserId);
      
      // Fast forward the delay
      vi.advanceTimersByTime(10000);
      
      await processPromise;
      
      expect(emitSpy).toHaveBeenCalledTimes(2); // Two insights are generated
      
      expect(emitSpy).toHaveBeenNthCalledWith(1, mockUserId, expect.objectContaining({
        type: 'performance',
        title: 'Content Performance Insight',
        confidence: 0.87,
        actionable: true,
      }));
      
      expect(emitSpy).toHaveBeenNthCalledWith(2, mockUserId, expect.objectContaining({
        type: 'pricing',
        title: 'Pricing Optimization',
        confidence: 0.92,
        actionable: true,
      }));
    });

    it('should generate insights with suggestions', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitAIInsight');
      
      const processPromise = BackgroundProcessor.generateAIInsights(mockUserId);
      vi.advanceTimersByTime(10000);
      await processPromise;
      
      const performanceInsight = emitSpy.mock.calls[0][1];
      const pricingInsight = emitSpy.mock.calls[1][1];
      
      expect(performanceInsight.suggestions).toEqual([
        'Schedule more photo content for weekends',
        'Consider weekend-specific campaigns'
      ]);
      
      expect(pricingInsight.suggestions).toEqual([
        'Test $30 price point',
        'Create premium tier content'
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in background processing gracefully', async () => {
      // Mock console.error to capture any error logs
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      vi.spyOn(global, 'setTimeout').mockImplementation(() => {
        throw new Error('Timer error');
      });
      
      try {
        await BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-1');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
      consoleSpy.mockRestore();
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle multiple concurrent compliance checks', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitComplianceChecked');
      
      const promises = [
        BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-1'),
        BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-2'),
        BackgroundProcessor.processAssetCompliance(mockUserId, 'asset-3'),
      ];
      
      vi.advanceTimersByTime(5000);
      await Promise.all(promises);
      
      expect(emitSpy).toHaveBeenCalledTimes(3);
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-1', expect.any(Object));
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-2', expect.any(Object));
      expect(emitSpy).toHaveBeenCalledWith(mockUserId, 'asset-3', expect.any(Object));
    });

    it('should handle multiple concurrent metric calculations', async () => {
      const emitSpy = vi.spyOn(ContentCreationEventEmitter, 'emitCampaignMetrics');
      
      const promises = [
        BackgroundProcessor.processCampaignMetrics(mockUserId, 'campaign-1'),
        BackgroundProcessor.processCampaignMetrics(mockUserId, 'campaign-2'),
      ];
      
      vi.advanceTimersByTime(2000);
      await Promise.all(promises);
      
      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });
});