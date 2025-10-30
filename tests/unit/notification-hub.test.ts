/**
 * Tests for Notification Hub
 * Tests cross-stack notifications and event handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
const mockEventEmitter = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  removeAllListeners: vi.fn()
};

const mockWebSocketClient = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1 // OPEN
};

const mockEmailService = {
  sendEmail: vi.fn()
};

const mockPushService = {
  sendPush: vi.fn()
};

vi.mock('events', () => ({
  EventEmitter: vi.fn(() => mockEventEmitter)
}));

vi.mock('ws', () => ({
  WebSocket: vi.fn(() => mockWebSocketClient)
}));

// Types for the notification hub
interface CrossStackEvent {
  id: string;
  type: 'ai_analysis_complete' | 'content_generated' | 'campaign_executed' | 'onlyfans_performance' | 'analytics_insight';
  source: 'ai' | 'content' | 'marketing' | 'onlyfans' | 'analytics';
  target?: string[];
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
}

interface NotificationChannel {
  type: 'websocket' | 'email' | 'push' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
}

interface NotificationRule {
  eventType: string;
  condition?: (event: CrossStackEvent) => boolean;
  channels: string[];
  template?: string;
  throttle?: number; // milliseconds
}

// Mock implementation of NotificationHub
class NotificationHub {
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: NotificationRule[] = [];
  private eventHistory: CrossStackEvent[] = [];
  private throttleCache: Map<string, number> = new Map();

  constructor(
    private eventEmitter = mockEventEmitter,
    private emailService = mockEmailService,
    private pushService = mockPushService
  ) {
    this.setupDefaultChannels();
    this.setupDefaultRules();
  }

  private setupDefaultChannels() {
    this.channels.set('websocket', {
      type: 'websocket',
      enabled: true,
      config: { endpoint: 'ws://localhost:3001/notifications' }
    });

    this.channels.set('email', {
      type: 'email',
      enabled: true,
      config: { from: 'notifications@huntaze.com' }
    });

    this.channels.set('push', {
      type: 'push',
      enabled: true,
      config: { vapidKey: 'test-vapid-key' }
    });
  }

  private setupDefaultRules() {
    this.rules = [
      {
        eventType: 'ai_analysis_complete',
        channels: ['websocket'],
        condition: (event) => event.priority !== 'low'
      },
      {
        eventType: 'onlyfans_performance',
        channels: ['websocket', 'email'],
        condition: (event) => event.data.engagement > 0.8,
        throttle: 300000 // 5 minutes
      },
      {
        eventType: 'campaign_executed',
        channels: ['websocket', 'push'],
        condition: (event) => event.priority === 'high'
      }
    ];
  }

  async notifyAcrossStacks(event: CrossStackEvent): Promise<{
    success: boolean;
    channelsNotified: string[];
    errors?: string[];
  }> {
    const errors: string[] = [];
    const channelsNotified: string[] = [];

    try {
      // Store event in history
      this.eventHistory.push(event);
      if (this.eventHistory.length > 1000) {
        this.eventHistory = this.eventHistory.slice(-1000);
      }

      // Find applicable rules
      const applicableRules = this.rules.filter(rule => 
        rule.eventType === event.type && 
        (!rule.condition || rule.condition(event))
      );

      // Process each rule
      for (const rule of applicableRules) {
        // Check throttling
        if (rule.throttle) {
          const throttleKey = `${rule.eventType}-${event.userId || 'global'}`;
          const lastNotification = this.throttleCache.get(throttleKey);
          if (lastNotification && Date.now() - lastNotification < rule.throttle) {
            continue; // Skip due to throttling
          }
          this.throttleCache.set(throttleKey, Date.now());
        }

        // Send to each channel
        for (const channelName of rule.channels) {
          try {
            await this.sendToChannel(channelName, event, rule.template);
            channelsNotified.push(channelName);
          } catch (error) {
            errors.push(`Failed to send to ${channelName}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // Emit internal event
      this.eventEmitter.emit('cross-stack-event', event);

      return {
        success: errors.length === 0,
        channelsNotified: [...new Set(channelsNotified)],
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        channelsNotified: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async sendToChannel(channelName: string, event: CrossStackEvent, template?: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel || !channel.enabled) {
      throw new Error(`Channel ${channelName} not available`);
    }

    const message = this.formatMessage(event, template);

    switch (channel.type) {
      case 'websocket':
        if (mockWebSocketClient.readyState === 1) {
          mockWebSocketClient.send(JSON.stringify({
            type: 'notification',
            event: event.type,
            data: message,
            timestamp: event.timestamp
          }));
        } else {
          throw new Error('WebSocket not connected');
        }
        break;

      case 'email':
        await this.emailService.sendEmail({
          to: event.userId ? `user-${event.userId}@huntaze.com` : 'admin@huntaze.com',
          subject: `Huntaze Notification: ${event.type}`,
          body: message,
          from: channel.config.from
        });
        break;

      case 'push':
        await this.pushService.sendPush({
          userId: event.userId,
          title: `Huntaze: ${event.type}`,
          body: message,
          data: event.data
        });
        break;

      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  private formatMessage(event: CrossStackEvent, template?: string): string {
    if (template) {
      return template
        .replace('{eventType}', event.type)
        .replace('{source}', event.source)
        .replace('{timestamp}', event.timestamp.toISOString())
        .replace('{data}', JSON.stringify(event.data));
    }

    // Default formatting
    switch (event.type) {
      case 'ai_analysis_complete':
        return `AI analysis completed for ${event.source}. Results: ${JSON.stringify(event.data)}`;
      
      case 'content_generated':
        return `New content generated: ${event.data.contentType || 'unknown type'}. ${event.data.count || 1} items created.`;
      
      case 'campaign_executed':
        return `Marketing campaign executed: ${event.data.campaignName || 'Unnamed'}. Reach: ${event.data.estimatedReach || 'unknown'}.`;
      
      case 'onlyfans_performance':
        return `OnlyFans performance update: ${event.data.engagement || 0}% engagement, ${event.data.revenue || 0} revenue.`;
      
      case 'analytics_insight':
        return `New analytics insight: ${event.data.insight || 'Performance data updated'}.`;
      
      default:
        return `Cross-stack event: ${event.type} from ${event.source}`;
    }
  }

  addNotificationRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  removeNotificationRule(eventType: string): void {
    this.rules = this.rules.filter(rule => rule.eventType !== eventType);
  }

  enableChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.enabled = true;
    }
  }

  disableChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.enabled = false;
    }
  }

  getEventHistory(limit: number = 100): CrossStackEvent[] {
    return this.eventHistory.slice(-limit);
  }

  getChannelStatus(): Record<string, { enabled: boolean; type: string }> {
    const status: Record<string, { enabled: boolean; type: string }> = {};
    this.channels.forEach((channel, name) => {
      status[name] = {
        enabled: channel.enabled,
        type: channel.type
      };
    });
    return status;
  }

  clearThrottleCache(): void {
    this.throttleCache.clear();
  }
}

describe('NotificationHub', () => {
  let notificationHub: NotificationHub;

  beforeEach(() => {
    notificationHub = new NotificationHub();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('notifyAcrossStacks', () => {
    it('should send notifications to appropriate channels', async () => {
      const event: CrossStackEvent = {
        id: 'event-123',
        type: 'ai_analysis_complete',
        source: 'ai',
        data: { analysis: 'completed', confidence: 0.95 },
        priority: 'high',
        timestamp: new Date(),
        userId: 'user-123'
      };

      mockWebSocketClient.readyState = 1; // OPEN
      mockEmailService.sendEmail.mockResolvedValue({ sent: true });

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(true);
      expect(result.channelsNotified).toContain('websocket');
      expect(mockWebSocketClient.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"notification"')
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('cross-stack-event', event);
    });

    it('should handle OnlyFans performance notifications with throttling', async () => {
      const event: CrossStackEvent = {
        id: 'perf-123',
        type: 'onlyfans_performance',
        source: 'onlyfans',
        data: { engagement: 0.85, revenue: 1500 },
        priority: 'medium',
        timestamp: new Date(),
        userId: 'user-456'
      };

      mockWebSocketClient.readyState = 1;
      mockEmailService.sendEmail.mockResolvedValue({ sent: true });

      // First notification should go through
      const result1 = await notificationHub.notifyAcrossStacks(event);
      expect(result1.success).toBe(true);
      expect(result1.channelsNotified).toContain('websocket');
      expect(result1.channelsNotified).toContain('email');

      // Second notification within throttle period should be throttled
      const result2 = await notificationHub.notifyAcrossStacks({
        ...event,
        id: 'perf-124',
        timestamp: new Date()
      });

      expect(result2.success).toBe(true);
      expect(result2.channelsNotified).toHaveLength(0); // Throttled

      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle campaign execution notifications', async () => {
      const event: CrossStackEvent = {
        id: 'campaign-789',
        type: 'campaign_executed',
        source: 'marketing',
        data: { 
          campaignName: 'Summer Promo',
          estimatedReach: 5000,
          messagesScheduled: 25
        },
        priority: 'high',
        timestamp: new Date(),
        userId: 'user-789'
      };

      mockWebSocketClient.readyState = 1;
      mockPushService.sendPush.mockResolvedValue({ sent: true });

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(true);
      expect(result.channelsNotified).toContain('websocket');
      expect(result.channelsNotified).toContain('push');

      expect(mockPushService.sendPush).toHaveBeenCalledWith({
        userId: 'user-789',
        title: 'Huntaze: campaign_executed',
        body: expect.stringContaining('Summer Promo'),
        data: event.data
      });
    });

    it('should handle low priority events correctly', async () => {
      const event: CrossStackEvent = {
        id: 'low-priority-123',
        type: 'ai_analysis_complete',
        source: 'ai',
        data: { analysis: 'routine check' },
        priority: 'low',
        timestamp: new Date()
      };

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(true);
      expect(result.channelsNotified).toHaveLength(0); // Filtered out by condition
      expect(mockWebSocketClient.send).not.toHaveBeenCalled();
    });

    it('should handle channel failures gracefully', async () => {
      const event: CrossStackEvent = {
        id: 'error-test-123',
        type: 'campaign_executed',
        source: 'marketing',
        data: { campaignName: 'Test Campaign' },
        priority: 'high',
        timestamp: new Date()
      };

      mockWebSocketClient.readyState = 0; // CONNECTING (not ready)
      mockPushService.sendPush.mockRejectedValue(new Error('Push service unavailable'));

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain(expect.stringContaining('WebSocket not connected'));
      expect(result.errors).toContain(expect.stringContaining('Push service unavailable'));
    });

    it('should store events in history', async () => {
      const events: CrossStackEvent[] = [
        {
          id: 'hist-1',
          type: 'content_generated',
          source: 'content',
          data: { contentType: 'image' },
          priority: 'medium',
          timestamp: new Date()
        },
        {
          id: 'hist-2',
          type: 'analytics_insight',
          source: 'analytics',
          data: { insight: 'Peak engagement at 8 PM' },
          priority: 'low',
          timestamp: new Date()
        }
      ];

      for (const event of events) {
        await notificationHub.notifyAcrossStacks(event);
      }

      const history = notificationHub.getEventHistory();
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('hist-1');
      expect(history[1].id).toBe('hist-2');
    });
  });

  describe('Channel Management', () => {
    it('should enable and disable channels', () => {
      // Initially enabled
      let status = notificationHub.getChannelStatus();
      expect(status.websocket.enabled).toBe(true);

      // Disable channel
      notificationHub.disableChannel('websocket');
      status = notificationHub.getChannelStatus();
      expect(status.websocket.enabled).toBe(false);

      // Re-enable channel
      notificationHub.enableChannel('websocket');
      status = notificationHub.getChannelStatus();
      expect(status.websocket.enabled).toBe(true);
    });

    it('should not send to disabled channels', async () => {
      notificationHub.disableChannel('websocket');

      const event: CrossStackEvent = {
        id: 'disabled-test',
        type: 'ai_analysis_complete',
        source: 'ai',
        data: { analysis: 'test' },
        priority: 'high',
        timestamp: new Date()
      };

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Channel websocket not available'));
      expect(mockWebSocketClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Rule Management', () => {
    it('should add custom notification rules', async () => {
      const customRule: NotificationRule = {
        eventType: 'content_generated',
        channels: ['email'],
        condition: (event) => event.data.contentType === 'video',
        template: 'New video content: {data}'
      };

      notificationHub.addNotificationRule(customRule);

      const event: CrossStackEvent = {
        id: 'custom-rule-test',
        type: 'content_generated',
        source: 'content',
        data: { contentType: 'video', title: 'New Tutorial' },
        priority: 'medium',
        timestamp: new Date(),
        userId: 'user-custom'
      };

      mockEmailService.sendEmail.mockResolvedValue({ sent: true });

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(true);
      expect(result.channelsNotified).toContain('email');
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'user-user-custom@huntaze.com',
        subject: 'Huntaze Notification: content_generated',
        body: expect.stringContaining('New video content:'),
        from: 'notifications@huntaze.com'
      });
    });

    it('should remove notification rules', async () => {
      notificationHub.removeNotificationRule('ai_analysis_complete');

      const event: CrossStackEvent = {
        id: 'removed-rule-test',
        type: 'ai_analysis_complete',
        source: 'ai',
        data: { analysis: 'test' },
        priority: 'high',
        timestamp: new Date()
      };

      const result = await notificationHub.notifyAcrossStacks(event);

      expect(result.success).toBe(true);
      expect(result.channelsNotified).toHaveLength(0); // No rules match
      expect(mockWebSocketClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should format different event types correctly', async () => {
      const events = [
        {
          type: 'content_generated' as const,
          data: { contentType: 'image', count: 5 },
          expectedMessage: 'New content generated: image. 5 items created.'
        },
        {
          type: 'analytics_insight' as const,
          data: { insight: 'Engagement increased by 25%' },
          expectedMessage: 'New analytics insight: Engagement increased by 25%.'
        }
      ];

      mockWebSocketClient.readyState = 1;

      for (const { type, data, expectedMessage } of events) {
        // Add a rule for this event type
        notificationHub.addNotificationRule({
          eventType: type,
          channels: ['websocket']
        });

        const event: CrossStackEvent = {
          id: `format-test-${type}`,
          type,
          source: 'content',
          data,
          priority: 'medium',
          timestamp: new Date()
        };

        await notificationHub.notifyAcrossStacks(event);

        expect(mockWebSocketClient.send).toHaveBeenCalledWith(
          expect.stringContaining(expectedMessage)
        );
      }
    });

    it('should use custom templates when provided', async () => {
      const customRule: NotificationRule = {
        eventType: 'onlyfans_performance',
        channels: ['websocket'],
        template: 'Performance Alert: {source} reported {data} at {timestamp}'
      };

      notificationHub.addNotificationRule(customRule);

      const event: CrossStackEvent = {
        id: 'template-test',
        type: 'onlyfans_performance',
        source: 'onlyfans',
        data: { engagement: 0.9 },
        priority: 'high',
        timestamp: new Date('2024-01-15T10:00:00Z')
      };

      mockWebSocketClient.readyState = 1;

      await notificationHub.notifyAcrossStacks(event);

      expect(mockWebSocketClient.send).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert: onlyfans reported')
      );
      expect(mockWebSocketClient.send).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-15T10:00:00.000Z')
      );
    });
  });

  describe('Throttling and Rate Limiting', () => {
    it('should respect throttle settings per user', async () => {
      const rule: NotificationRule = {
        eventType: 'test_throttle',
        channels: ['websocket'],
        throttle: 1000 // 1 second
      };

      notificationHub.addNotificationRule(rule);
      mockWebSocketClient.readyState = 1;

      const createEvent = (userId: string) => ({
        id: `throttle-${userId}-${Date.now()}`,
        type: 'test_throttle' as const,
        source: 'ai' as const,
        data: { test: true },
        priority: 'medium' as const,
        timestamp: new Date(),
        userId
      });

      // Send events for different users - should not be throttled
      await notificationHub.notifyAcrossStacks(createEvent('user1'));
      await notificationHub.notifyAcrossStacks(createEvent('user2'));

      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(2);

      // Send another event for user1 immediately - should be throttled
      await notificationHub.notifyAcrossStacks(createEvent('user1'));

      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(2); // Still 2, not 3
    });

    it('should clear throttle cache', async () => {
      const rule: NotificationRule = {
        eventType: 'test_clear_throttle',
        channels: ['websocket'],
        throttle: 60000 // 1 minute
      };

      notificationHub.addNotificationRule(rule);
      mockWebSocketClient.readyState = 1;

      const event: CrossStackEvent = {
        id: 'clear-throttle-test',
        type: 'test_clear_throttle',
        source: 'ai',
        data: { test: true },
        priority: 'medium',
        timestamp: new Date(),
        userId: 'user-clear'
      };

      // First notification
      await notificationHub.notifyAcrossStacks(event);
      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(1);

      // Second notification (should be throttled)
      await notificationHub.notifyAcrossStacks({ ...event, id: 'clear-throttle-test-2' });
      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(1);

      // Clear throttle cache
      notificationHub.clearThrottleCache();

      // Third notification (should go through after cache clear)
      await notificationHub.notifyAcrossStacks({ ...event, id: 'clear-throttle-test-3' });
      expect(mockWebSocketClient.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event History Management', () => {
    it('should limit event history size', async () => {
      // Create more events than the limit (1000)
      const events = Array.from({ length: 1050 }, (_, i) => ({
        id: `history-${i}`,
        type: 'content_generated' as const,
        source: 'content' as const,
        data: { index: i },
        priority: 'low' as const,
        timestamp: new Date()
      }));

      for (const event of events) {
        await notificationHub.notifyAcrossStacks(event);
      }

      const history = notificationHub.getEventHistory();
      expect(history).toHaveLength(1000); // Should be limited to 1000
      expect(history[0].data.index).toBe(50); // Should keep the latest 1000
      expect(history[999].data.index).toBe(1049);
    });

    it('should return limited history when requested', () => {
      const history = notificationHub.getEventHistory(5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });
});