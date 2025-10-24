import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock data models based on the design document
interface MediaAsset {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  type: 'photo' | 'video' | 'story' | 'ppv';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  thumbnailUrl: string;
  originalUrl: string;
  fileSize: number;
  duration?: number;
  dimensions: { width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metrics: AssetMetrics;
  tags: string[];
  compliance: ComplianceStatus;
  uploadProgress?: number;
}

interface AssetMetrics {
  views: number;
  engagement: number;
  revenue: number;
  roi: number;
}

interface ComplianceStatus {
  status: 'pending' | 'approved' | 'rejected' | 'review_required';
  checkedAt: Date;
  violations: ComplianceViolation[];
  score: number;
}

interface ComplianceViolation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface PPVCampaign {
  id: string;
  name: string;
  launchDate: Date;
  targetAudience: AudienceSegment;
  status: 'active' | 'paused' | 'completed';
  metrics: CampaignMetrics;
  content: MediaAsset[];
}

interface AudienceSegment {
  id: string;
  name: string;
  criteria: any;
  size: number;
}

interface CampaignMetrics {
  openRate: number;
  purchaseRate: number;
  revenue: number;
  roi: number;
  conversions: number;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  context?: PageContext;
}

interface PageContext {
  currentPage: string;
  recentMetrics: any;
  selectedAssets: MediaAsset[];
}

// Validation schemas
const MediaAssetSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  title: z.string().min(1).max(255),
  type: z.enum(['photo', 'video', 'story', 'ppv']),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  thumbnailUrl: z.string().url(),
  originalUrl: z.string().url(),
  fileSize: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metrics: z.object({
    views: z.number().nonnegative(),
    engagement: z.number().nonnegative(),
    revenue: z.number().nonnegative(),
    roi: z.number()
  }),
  tags: z.array(z.string()),
  compliance: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'review_required']),
    checkedAt: z.date(),
    violations: z.array(z.any()),
    score: z.number().min(0).max(100)
  })
});

const PPVCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  launchDate: z.date(),
  status: z.enum(['active', 'paused', 'completed']),
  metrics: z.object({
    openRate: z.number().min(0).max(1),
    purchaseRate: z.number().min(0).max(1),
    revenue: z.number().nonnegative(),
    roi: z.number(),
    conversions: z.number().nonnegative()
  })
});

// Mock data
const mockMediaAsset: MediaAsset = {
  id: 'asset-1',
  creatorId: 'creator-1',
  title: 'Test Photo',
  description: 'A test photo asset',
  type: 'photo',
  status: 'draft',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  originalUrl: 'https://example.com/original.jpg',
  fileSize: 1024000,
  dimensions: { width: 1920, height: 1080 },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  metrics: {
    views: 100,
    engagement: 0.15,
    revenue: 50.0,
    roi: 2.5
  },
  tags: ['test', 'photo'],
  compliance: {
    status: 'approved',
    checkedAt: new Date('2024-01-01'),
    violations: [],
    score: 95
  }
};

const mockPPVCampaign: PPVCampaign = {
  id: 'campaign-1',
  name: 'Test Campaign',
  launchDate: new Date('2024-02-01'),
  targetAudience: {
    id: 'audience-1',
    name: 'VIP Fans',
    criteria: { tier: 'vip' },
    size: 500
  },
  status: 'active',
  metrics: {
    openRate: 0.75,
    purchaseRate: 0.25,
    revenue: 1250.0,
    roi: 3.2,
    conversions: 125
  },
  content: [mockMediaAsset]
};

// Utility functions
class AssetMetricsCalculator {
  static calculateROI(revenue: number, cost: number): number {
    if (cost === 0) return revenue > 0 ? Infinity : 0;
    return revenue / cost;
  }

  static calculateEngagementRate(interactions: number, views: number): number {
    if (views === 0) return 0;
    return interactions / views;
  }

  static updateMetrics(asset: MediaAsset, newMetrics: Partial<AssetMetrics>): MediaAsset {
    return {
      ...asset,
      metrics: { ...asset.metrics, ...newMetrics },
      updatedAt: new Date()
    };
  }
}

class CampaignManager {
  static calculateCampaignROI(campaign: PPVCampaign): number {
    const { revenue, conversions } = campaign.metrics;
    const estimatedCost = conversions * 10; // Assume $10 cost per conversion
    return AssetMetricsCalculator.calculateROI(revenue, estimatedCost);
  }

  static updateCampaignStatus(
    campaign: PPVCampaign, 
    newStatus: PPVCampaign['status']
  ): PPVCampaign {
    return {
      ...campaign,
      status: newStatus
    };
  }

  static duplicateCampaign(campaign: PPVCampaign, newName: string): PPVCampaign {
    return {
      ...campaign,
      id: `${campaign.id}-copy`,
      name: newName,
      status: 'paused',
      metrics: {
        openRate: 0,
        purchaseRate: 0,
        revenue: 0,
        roi: 0,
        conversions: 0
      }
    };
  }
}

class ConversationManager {
  private messages: ChatMessage[] = [];

  addMessage(content: string, sender: 'user' | 'ai', context?: PageContext): ChatMessage {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      sender,
      timestamp: new Date(),
      context
    };
    this.messages.push(message);
    return message;
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.messages];
  }

  exportConversation(): string {
    return this.messages
      .map(msg => `[${msg.timestamp.toISOString()}] ${msg.sender}: ${msg.content}`)
      .join('\n');
  }

  clearHistory(): void {
    this.messages = [];
  }
}

describe('Content Creation Data Models - Task 2', () => {
  describe('MediaAsset Model Validation - Task 2.1', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should validate MediaAsset with correct schema', () => {
      const result = MediaAssetSchema.safeParse(mockMediaAsset);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.id).toBe('asset-1');
        expect(result.data.type).toBe('photo');
        expect(result.data.metrics.views).toBe(100);
      }
    });

    it('should reject MediaAsset with invalid data', () => {
      const invalidAsset = {
        ...mockMediaAsset,
        title: '', // Invalid: empty title
        fileSize: -1, // Invalid: negative file size
        metrics: {
          ...mockMediaAsset.metrics,
          views: -10 // Invalid: negative views
        }
      };

      const result = MediaAssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
        expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(true);
        expect(result.error.issues.some(issue => issue.path.includes('fileSize'))).toBe(true);
        expect(result.error.issues.some(issue => issue.path.includes('views'))).toBe(true);
      }
    });

    it('should calculate asset metrics correctly', () => {
      const roi = AssetMetricsCalculator.calculateROI(100, 50);
      expect(roi).toBe(2);

      const engagementRate = AssetMetricsCalculator.calculateEngagementRate(15, 100);
      expect(engagementRate).toBe(0.15);

      // Edge case: zero cost
      const infiniteROI = AssetMetricsCalculator.calculateROI(100, 0);
      expect(infiniteROI).toBe(Infinity);

      // Edge case: zero views
      const zeroEngagement = AssetMetricsCalculator.calculateEngagementRate(10, 0);
      expect(zeroEngagement).toBe(0);
    });

    it('should update asset metrics and timestamp', () => {
      const originalDate = mockMediaAsset.updatedAt;
      const updatedAsset = AssetMetricsCalculator.updateMetrics(mockMediaAsset, {
        views: 200,
        revenue: 75.0
      });

      expect(updatedAsset.metrics.views).toBe(200);
      expect(updatedAsset.metrics.revenue).toBe(75.0);
      expect(updatedAsset.metrics.engagement).toBe(0.15); // Unchanged
      expect(updatedAsset.updatedAt).not.toEqual(originalDate);
    });

    it('should handle asset status management', () => {
      const draftAsset = { ...mockMediaAsset, status: 'draft' as const };
      const publishedAsset = { ...draftAsset, status: 'published' as const };

      expect(draftAsset.status).toBe('draft');
      expect(publishedAsset.status).toBe('published');

      // Validate status transitions
      const validStatuses = ['draft', 'scheduled', 'published', 'archived'];
      validStatuses.forEach(status => {
        const asset = { ...mockMediaAsset, status: status as any };
        const result = MediaAssetSchema.safeParse(asset);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('PPVCampaign Model with Metrics - Task 2.2', () => {
    it('should validate PPVCampaign with correct schema', () => {
      const result = PPVCampaignSchema.safeParse(mockPPVCampaign);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.name).toBe('Test Campaign');
        expect(result.data.status).toBe('active');
        expect(result.data.metrics.openRate).toBe(0.75);
      }
    });

    it('should calculate campaign ROI correctly', () => {
      const roi = CampaignManager.calculateCampaignROI(mockPPVCampaign);
      expect(roi).toBeCloseTo(1.0, 2); // 1250 / (125 * 10) = 1.0
    });

    it('should manage campaign status lifecycle', () => {
      const pausedCampaign = CampaignManager.updateCampaignStatus(mockPPVCampaign, 'paused');
      expect(pausedCampaign.status).toBe('paused');

      const completedCampaign = CampaignManager.updateCampaignStatus(pausedCampaign, 'completed');
      expect(completedCampaign.status).toBe('completed');
    });

    it('should duplicate campaign with reset metrics', () => {
      const duplicatedCampaign = CampaignManager.duplicateCampaign(mockPPVCampaign, 'Test Campaign Copy');
      
      expect(duplicatedCampaign.id).toBe('campaign-1-copy');
      expect(duplicatedCampaign.name).toBe('Test Campaign Copy');
      expect(duplicatedCampaign.status).toBe('paused');
      expect(duplicatedCampaign.metrics.revenue).toBe(0);
      expect(duplicatedCampaign.metrics.conversions).toBe(0);
      expect(duplicatedCampaign.content).toEqual(mockPPVCampaign.content);
    });

    it('should validate campaign metrics ranges', () => {
      const invalidCampaign = {
        ...mockPPVCampaign,
        metrics: {
          openRate: 1.5, // Invalid: > 1
          purchaseRate: -0.1, // Invalid: < 0
          revenue: -100, // Invalid: negative
          roi: 0,
          conversions: -5 // Invalid: negative
        }
      };

      const result = PPVCampaignSchema.safeParse(invalidCampaign);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AI Conversation and Tool Models - Task 2.3', () => {
    let conversationManager: ConversationManager;

    beforeEach(() => {
      conversationManager = new ConversationManager();
    });

    it('should create and manage chat messages with context', () => {
      const context: PageContext = {
        currentPage: '/creation',
        recentMetrics: { revenue: 100 },
        selectedAssets: [mockMediaAsset]
      };

      const userMessage = conversationManager.addMessage(
        'How can I optimize my content?',
        'user',
        context
      );

      expect(userMessage.sender).toBe('user');
      expect(userMessage.content).toBe('How can I optimize my content?');
      expect(userMessage.context).toEqual(context);
      expect(userMessage.id).toMatch(/^msg-\d+$/);
    });

    it('should maintain conversation history', () => {
      conversationManager.addMessage('Hello', 'user');
      conversationManager.addMessage('Hi there! How can I help?', 'ai');
      conversationManager.addMessage('I need help with pricing', 'user');

      const history = conversationManager.getConversationHistory();
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Hello');
      expect(history[1].sender).toBe('ai');
      expect(history[2].content).toBe('I need help with pricing');
    });

    it('should export conversation in readable format', () => {
      const message1 = conversationManager.addMessage('Test message 1', 'user');
      const message2 = conversationManager.addMessage('Test response 1', 'ai');

      const exported = conversationManager.exportConversation();
      
      expect(exported).toContain('user: Test message 1');
      expect(exported).toContain('ai: Test response 1');
      expect(exported).toContain(message1.timestamp.toISOString());
      expect(exported).toContain(message2.timestamp.toISOString());
    });

    it('should clear conversation history', () => {
      conversationManager.addMessage('Message 1', 'user');
      conversationManager.addMessage('Message 2', 'ai');
      
      expect(conversationManager.getConversationHistory()).toHaveLength(2);
      
      conversationManager.clearHistory();
      expect(conversationManager.getConversationHistory()).toHaveLength(0);
    });

    it('should handle context awareness in messages', () => {
      const context1: PageContext = {
        currentPage: '/creation',
        recentMetrics: { views: 1000 },
        selectedAssets: []
      };

      const context2: PageContext = {
        currentPage: '/assistant',
        recentMetrics: { revenue: 500 },
        selectedAssets: [mockMediaAsset]
      };

      const msg1 = conversationManager.addMessage('Question from creation page', 'user', context1);
      const msg2 = conversationManager.addMessage('Question from assistant page', 'user', context2);

      expect(msg1.context?.currentPage).toBe('/creation');
      expect(msg2.context?.currentPage).toBe('/assistant');
      expect(msg2.context?.selectedAssets).toHaveLength(1);
    });
  });

  describe('Data Model Integration Tests - Task 2.4', () => {
    it('should handle complex asset-campaign relationships', () => {
      const campaign = mockPPVCampaign;
      const asset = campaign.content[0];

      expect(asset.id).toBe('asset-1');
      expect(campaign.content).toContain(asset);
      
      // Update asset metrics and verify campaign still references it
      const updatedAsset = AssetMetricsCalculator.updateMetrics(asset, { views: 500 });
      const updatedCampaign = {
        ...campaign,
        content: campaign.content.map(a => a.id === asset.id ? updatedAsset : a)
      };

      expect(updatedCampaign.content[0].metrics.views).toBe(500);
    });

    it('should validate cross-model data consistency', () => {
      // Ensure asset creator matches campaign context
      const asset = mockMediaAsset;
      const campaign = mockPPVCampaign;

      expect(asset.creatorId).toBe('creator-1');
      expect(campaign.content[0].creatorId).toBe('creator-1');
    });

    it('should handle error scenarios gracefully', () => {
      // Test with null/undefined values
      expect(() => AssetMetricsCalculator.calculateROI(100, 0)).not.toThrow();
      expect(() => AssetMetricsCalculator.calculateEngagementRate(10, 0)).not.toThrow();

      // Test with invalid campaign data
      const invalidCampaign = { ...mockPPVCampaign, metrics: null as any };
      expect(() => CampaignManager.calculateCampaignROI(invalidCampaign)).toThrow();
    });

    it('should maintain data integrity during updates', () => {
      const originalAsset = { ...mockMediaAsset };
      const updatedAsset = AssetMetricsCalculator.updateMetrics(originalAsset, { views: 200 });

      // Original should be unchanged
      expect(originalAsset.metrics.views).toBe(100);
      expect(originalAsset.updatedAt).toEqual(mockMediaAsset.updatedAt);

      // Updated should have new values
      expect(updatedAsset.metrics.views).toBe(200);
      expect(updatedAsset.updatedAt).not.toEqual(originalAsset.updatedAt);
    });
  });
});