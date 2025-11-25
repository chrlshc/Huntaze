/**
 * Unit Tests for Demo Tracking
 * 
 * Tests the demo engagement tracking functionality
 * Validates: Requirements 7.5, 12.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { demoTracker, DemoSession } from '@/lib/analytics/demo-tracking';

describe('DemoTracker', () => {
  beforeEach(() => {
    // Reset tracker state before each test
    if (demoTracker.getSession()) {
      demoTracker.endSession();
    }
    
    // Mock gtag
    (global as any).window = {
      gtag: vi.fn()
    };
  });

  describe('Session Management', () => {
    it('should start a new session with unique ID', () => {
      const sessionId1 = demoTracker.startSession();
      demoTracker.endSession();
      const sessionId2 = demoTracker.startSession();
      
      expect(sessionId1).toBeTruthy();
      expect(sessionId2).toBeTruthy();
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should track session start time', () => {
      const startTime = Date.now();
      demoTracker.startSession();
      const session = demoTracker.getSession();
      
      expect(session).toBeTruthy();
      expect(session!.startTime).toBeGreaterThanOrEqual(startTime);
      expect(session!.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should initialize session with empty interactions', () => {
      demoTracker.startSession();
      const session = demoTracker.getSession();
      
      expect(session!.interactions).toEqual([]);
      expect(session!.ctaShown).toBe(false);
      expect(session!.ctaClicked).toBe(false);
    });

    it('should calculate total time spent on session end', () => {
      demoTracker.startSession();
      const session = demoTracker.getSession();
      const startTime = session!.startTime;
      
      // Wait a bit
      const delay = 100;
      const endTime = startTime + delay;
      vi.spyOn(Date, 'now').mockReturnValue(endTime);
      
      const endedSession = demoTracker.endSession();
      
      expect(endedSession).toBeTruthy();
      expect(endedSession!.totalTimeSpent).toBe(delay);
      expect(endedSession!.endTime).toBe(endTime);
    });
  });

  describe('Interaction Tracking', () => {
    beforeEach(() => {
      demoTracker.startSession();
    });

    it('should track hover interactions', () => {
      demoTracker.trackInteraction('hover', 'metric_followers');
      const session = demoTracker.getSession();
      
      expect(session!.interactions).toHaveLength(1);
      expect(session!.interactions[0]).toMatchObject({
        type: 'hover',
        element: 'metric_followers'
      });
    });

    it('should track click interactions', () => {
      demoTracker.trackInteraction('click', 'chart_bar_Mon');
      const session = demoTracker.getSession();
      
      expect(session!.interactions).toHaveLength(1);
      expect(session!.interactions[0]).toMatchObject({
        type: 'click',
        element: 'chart_bar_Mon'
      });
    });

    it('should track view interactions', () => {
      demoTracker.trackInteraction('view', 'dashboard_demo');
      const session = demoTracker.getSession();
      
      expect(session!.interactions).toHaveLength(1);
      expect(session!.interactions[0]).toMatchObject({
        type: 'view',
        element: 'dashboard_demo'
      });
    });

    it('should track multiple interactions in order', () => {
      demoTracker.trackInteraction('view', 'dashboard_demo');
      demoTracker.trackInteraction('hover', 'metric_followers');
      demoTracker.trackInteraction('click', 'chart_bar_Mon');
      
      const session = demoTracker.getSession();
      
      expect(session!.interactions).toHaveLength(3);
      expect(session!.interactions[0].type).toBe('view');
      expect(session!.interactions[1].type).toBe('hover');
      expect(session!.interactions[2].type).toBe('click');
    });

    it('should include timestamp with each interaction', () => {
      const beforeTime = Date.now();
      demoTracker.trackInteraction('hover', 'metric_followers');
      const afterTime = Date.now();
      
      const session = demoTracker.getSession();
      const interaction = session!.interactions[0];
      
      expect(interaction.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(interaction.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include session ID with each interaction', () => {
      const session = demoTracker.getSession();
      const sessionId = session!.sessionId;
      
      demoTracker.trackInteraction('hover', 'metric_followers');
      
      const interaction = session!.interactions[0];
      expect(interaction.sessionId).toBe(sessionId);
    });

    it('should send interaction events to gtag if available', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.trackInteraction('hover', 'metric_followers');
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'demo_interaction', expect.objectContaining({
        event_category: 'Demo',
        event_label: 'metric_followers',
        interaction_type: 'hover'
      }));
    });
  });

  describe('CTA Tracking', () => {
    beforeEach(() => {
      demoTracker.startSession();
    });

    it('should track when CTA is shown', () => {
      demoTracker.trackCTAShown();
      const session = demoTracker.getSession();
      
      expect(session!.ctaShown).toBe(true);
    });

    it('should track when CTA is clicked', () => {
      demoTracker.trackCTAClick();
      const session = demoTracker.getSession();
      
      expect(session!.ctaClicked).toBe(true);
    });

    it('should send CTA shown event to gtag', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.trackCTAShown();
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'demo_cta_shown', expect.objectContaining({
        event_category: 'Demo'
      }));
    });

    it('should send CTA clicked event to gtag', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.trackCTAClick();
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'demo_cta_clicked', expect.objectContaining({
        event_category: 'Demo',
        event_label: 'Get Started',
        conversion: true
      }));
    });

    it('should track conversion event when CTA is clicked', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.trackCTAClick();
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
        value: 1.0,
        currency: 'USD'
      }));
    });

    it('should include interaction count in CTA events', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.trackInteraction('hover', 'metric_followers');
      demoTracker.trackInteraction('click', 'chart_bar_Mon');
      demoTracker.trackCTAShown();
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'demo_cta_shown', expect.objectContaining({
        interaction_count: 2
      }));
    });
  });

  describe('Session Analytics', () => {
    it('should send session summary on end', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.startSession();
      demoTracker.trackInteraction('hover', 'metric_followers');
      demoTracker.trackCTAShown();
      demoTracker.endSession();
      
      expect(gtagMock).toHaveBeenCalledWith('event', 'demo_session_end', expect.objectContaining({
        event_category: 'Demo',
        interaction_count: 1,
        cta_shown: true,
        cta_clicked: false
      }));
    });

    it('should calculate engagement rate', () => {
      const gtagMock = vi.fn();
      (global as any).window.gtag = gtagMock;
      
      demoTracker.startSession();
      
      // Simulate multiple interactions
      for (let i = 0; i < 5; i++) {
        demoTracker.trackInteraction('hover', `element_${i}`);
      }
      
      demoTracker.endSession();
      
      const call = gtagMock.mock.calls.find(
        (call: any[]) => call[0] === 'event' && call[1] === 'demo_session_end'
      );
      
      expect(call).toBeTruthy();
      expect(call[2].engagement_rate).toBeGreaterThan(0);
      expect(call[2].engagement_rate).toBeLessThanOrEqual(100);
    });
  });

  describe('Auto-start Session', () => {
    it('should auto-start session on first interaction if not started', () => {
      expect(demoTracker.getSession()).toBeNull();
      
      demoTracker.trackInteraction('hover', 'metric_followers');
      
      expect(demoTracker.getSession()).toBeTruthy();
      expect(demoTracker.getSession()!.interactions).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tracking when gtag is not available', () => {
      (global as any).window = {};
      
      demoTracker.startSession();
      
      expect(() => {
        demoTracker.trackInteraction('hover', 'metric_followers');
        demoTracker.trackCTAShown();
        demoTracker.trackCTAClick();
        demoTracker.endSession();
      }).not.toThrow();
    });

    it('should handle CTA tracking without active session', () => {
      expect(() => {
        demoTracker.trackCTAShown();
        demoTracker.trackCTAClick();
      }).not.toThrow();
    });

    it('should handle ending session when no session exists', () => {
      const result = demoTracker.endSession();
      expect(result).toBeNull();
    });
  });
});
