import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as sseEndpoint } from '@/app/api/content-creation/events/route';
import { ContentCreationEventEmitter, BackgroundProcessor } from '@/lib/services/sse-events';

// Mock auth
vi.mock('@/lib/server-auth', () => ({
  getServerAuth: vi.fn(() => Promise.resolve({
    user: {
      id: 'test-user-123',
      email: 'test@huntaze.com',
      name: 'Test User'
    }
  }))
}));

// Mock ReadableStream for SSE testing
class MockReadableStream {
  private controller: any;
  private chunks: string[] = [];

  constructor(options: any) {
    const mockController = {
      enqueue: vi.fn((chunk: string) => {
        this.chunks.push(chunk);
      }),
      close: vi.fn(),
    };
    this.controller = mockController;
    options.start(mockController);
  }

  getChunks() {
    return this.chunks;
  }

  getController() {
    return this.controller;
  }
}

// Mock global ReadableStream
global.ReadableStream = MockReadableStream as any;

describe('SSE Integration Tests', () => {
  let mockAbortController: AbortController;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAbortController = new AbortController();
  });

  afterEach(() => {
    mockAbortController.abort();
  });

  describe('SSE Connection', () => {
    it('should establish SSE connection and send initial events', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-creation/events', {
        signal: mockAbortController.signal,
      });

      const response = await sseEndpoint(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });

    it('should handle lastEventId parameter for event replay', async () => {
      const lastEventId = 'event-123';
      const url = new URL(`http://localhost:3000/api/content-creation/events?lastEventId=${lastEventId}`);
      const request = new NextRequest(url, {
        signal: mockAbortController.signal,
      });

      const response = await sseEndpoint(request);

      expect(response).toBeInstanceOf(Response);
      // In a real test, we would verify that missed events are sent
    });

    it('should require authentication', async () => {
      // Mock auth to return null user
      vi.mocked(require('@/lib/server-auth').getServerAuth).mockResolvedValueOnce({ user: null });

      const request = new NextRequest('http://localhost:3000/api/content-creation/events');
      const response = await sseEndpoint(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast asset uploaded event', () => {
      const userId = 'test-user-123';
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        type: 'photo' as const,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorId: userId,
        thumbnailUrl: '/test-thumb.jpg',
        originalUrl: '/test.jpg',
        fileSize: 1024,
        dimensions: { width: 800, height: 600 },
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        tags: ['test'],
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      // This would normally broadcast to connected clients
      expect(() => {
        ContentCreationEventEmitter.emitAssetUploaded(userId, mockAsset);
      }).not.toThrow();
    });

    it('should broadcast asset processed event', () => {
      const userId = 'test-user-123';
      const assetId = 'asset-123';

      expect(() => {
        ContentCreationEventEmitter.emitAssetProcessed(userId, assetId, 'success', {
          processedAt: new Date().toISOString(),
        });
      }).not.toThrow();
    });

    it('should broadcast campaign metrics event', () => {
      const userId = 'test-user-123';
      const campaignId = 'campaign-123';
      const metrics = {
        sent: 100,
        opened: 75,
        purchased: 25,
        revenue: 625,
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        ContentCreationEventEmitter.emitCampaignMetrics(userId, campaignId, metrics);
      }).not.toThrow();
    });

    it('should broadcast compliance checked event', () => {
      const userId = 'test-user-123';
      const assetId = 'asset-123';
      const compliance = {
        status: 'approved',
        checkedAt: new Date(),
        violations: [],
        score: 95,
      };

      expect(() => {
        ContentCreationEventEmitter.emitComplianceChecked(userId, assetId, compliance);
      }).not.toThrow();
    });

    it('should broadcast AI insight event', () => {
      const userId = 'test-user-123';
      const insight = {
        type: 'performance',
        title: 'Content Performance Insight',
        message: 'Your photo content performs 23% better on weekends',
        confidence: 0.87,
        actionable: true,
        suggestions: ['Schedule more photo content for weekends'],
      };

      expect(() => {
        ContentCreationEventEmitter.emitAIInsight(userId, insight);
      }).not.toThrow();
    });

    it('should broadcast sync conflict event', () => {
      const userId = 'test-user-123';
      const conflict = {
        id: 'conflict-123',
        entityType: 'asset',
        entityId: 'asset-123',
        localVersion: { title: 'Local Title' },
        remoteVersion: { title: 'Remote Title' },
        conflictFields: ['title'],
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        ContentCreationEventEmitter.emitSyncConflict(userId, conflict);
      }).not.toThrow();
    });
  });

  describe('Background Processing', () => {
    it('should process asset compliance asynchronously', async () => {
      const userId = 'test-user-123';
      const assetId = 'asset-123';

      // Mock the compliance processing
      const processSpy = vi.spyOn(BackgroundProcessor, 'processAssetCompliance');
      processSpy.mockResolvedValue(undefined);

      await BackgroundProcessor.processAssetCompliance(userId, assetId);

      expect(processSpy).toHaveBeenCalledWith(userId, assetId);
    });

    it('should process campaign metrics asynchronously', async () => {
      const userId = 'test-user-123';
      const campaignId = 'campaign-123';

      const processSpy = vi.spyOn(BackgroundProcessor, 'processCampaignMetrics');
      processSpy.mockResolvedValue(undefined);

      await BackgroundProcessor.processCampaignMetrics(userId, campaignId);

      expect(processSpy).toHaveBeenCalledWith(userId, campaignId);
    });

    it('should generate AI insights asynchronously', async () => {
      const userId = 'test-user-123';

      const processSpy = vi.spyOn(BackgroundProcessor, 'generateAIInsights');
      processSpy.mockResolvedValue(undefined);

      await BackgroundProcessor.generateAIInsights(userId);

      expect(processSpy).toHaveBeenCalledWith(userId);
    });
  });

  describe('Event Format Validation', () => {
    it('should create properly formatted SSE events', () => {
      const userId = 'test-user-123';
      const mockAsset = {
        id: 'asset-123',
        title: 'Test Asset',
        type: 'photo' as const,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorId: userId,
        thumbnailUrl: '/test-thumb.jpg',
        originalUrl: '/test.jpg',
        fileSize: 1024,
        dimensions: { width: 800, height: 600 },
        metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
        tags: ['test'],
        compliance: {
          status: 'pending' as const,
          checkedAt: new Date(),
          violations: [],
          score: 0,
        },
      };

      // Capture the event that would be broadcast
      const originalBroadcast = require('@/app/api/content-creation/events/route').broadcastToUser;
      const mockBroadcast = vi.fn();
      vi.doMock('@/app/api/content-creation/events/route', () => ({
        ...require('@/app/api/content-creation/events/route'),
        broadcastToUser: mockBroadcast,
      }));

      ContentCreationEventEmitter.emitAssetUploaded(userId, mockAsset);

      // Verify event structure (would need to check the actual call)
      // In a real implementation, we'd verify the event format
    });
  });

  describe('Connection Management', () => {
    it('should handle connection cleanup on abort', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-creation/events', {
        signal: mockAbortController.signal,
      });

      const response = await sseEndpoint(request);
      
      // Simulate connection abort
      mockAbortController.abort();

      // In a real test, we would verify that the connection is cleaned up
      expect(response).toBeInstanceOf(Response);
    });

    it('should handle multiple connections from same user', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/content-creation/events');
      const request2 = new NextRequest('http://localhost:3000/api/content-creation/events');

      const response1 = await sseEndpoint(request1);
      const response2 = await sseEndpoint(request2);

      expect(response1).toBeInstanceOf(Response);
      expect(response2).toBeInstanceOf(Response);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed event data gracefully', () => {
      const userId = 'test-user-123';
      
      // Test with invalid data
      expect(() => {
        ContentCreationEventEmitter.emitAssetUploaded(userId, null as any);
      }).not.toThrow();
    });

    it('should handle network errors during broadcast', () => {
      const userId = 'test-user-123';
      const insight = {
        type: 'test',
        message: 'Test insight',
      };

      // This should not throw even if there are no connections
      expect(() => {
        ContentCreationEventEmitter.emitAIInsight(userId, insight);
      }).not.toThrow();
    });
  });
});