/**
 * Demo Engagement Tracking
 * 
 * Tracks user interactions with the interactive dashboard demo
 * to measure engagement and optimize conversion.
 */

export interface DemoInteractionEvent {
  type: 'hover' | 'click' | 'view';
  element: string;
  timestamp: number;
  sessionId: string;
}

export interface DemoSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  interactions: DemoInteractionEvent[];
  ctaShown: boolean;
  ctaClicked: boolean;
  totalTimeSpent: number;
}

class DemoTracker {
  private session: DemoSession | null = null;
  private sessionStartTime: number = 0;
  private interactionCount: number = 0;

  /**
   * Initialize a new demo session
   */
  startSession(): string {
    const sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.interactionCount = 0;
    
    this.session = {
      sessionId,
      startTime: this.sessionStartTime,
      interactions: [],
      ctaShown: false,
      ctaClicked: false,
      totalTimeSpent: 0
    };

    return sessionId;
  }

  /**
   * Track an interaction with the demo
   */
  trackInteraction(type: DemoInteractionEvent['type'], element: string): void {
    if (!this.session) {
      this.startSession();
    }

    const event: DemoInteractionEvent = {
      type,
      element,
      timestamp: Date.now(),
      sessionId: this.session!.sessionId
    };

    this.session!.interactions.push(event);
    this.interactionCount++;

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_interaction', {
        event_category: 'Demo',
        event_label: element,
        interaction_type: type,
        interaction_count: this.interactionCount
      });
    }
  }

  /**
   * Track when CTA is shown
   */
  trackCTAShown(): void {
    if (!this.session) return;

    this.session.ctaShown = true;
    const timeToShow = Date.now() - this.sessionStartTime;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_cta_shown', {
        event_category: 'Demo',
        time_to_show: timeToShow,
        interaction_count: this.interactionCount
      });
    }
  }

  /**
   * Track when CTA is clicked
   */
  trackCTAClick(): void {
    if (!this.session) return;

    this.session.ctaClicked = true;
    const timeToClick = Date.now() - this.sessionStartTime;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_cta_clicked', {
        event_category: 'Demo',
        event_label: 'Get Started',
        time_to_click: timeToClick,
        interaction_count: this.interactionCount,
        conversion: true
      });
    }

    // Also track as conversion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with actual conversion ID
        value: 1.0,
        currency: 'USD'
      });
    }
  }

  /**
   * End the demo session
   */
  endSession(): DemoSession | null {
    if (!this.session) return null;

    this.session.endTime = Date.now();
    this.session.totalTimeSpent = this.session.endTime - this.session.startTime;

    // Send session summary to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'demo_session_end', {
        event_category: 'Demo',
        session_duration: this.session.totalTimeSpent,
        interaction_count: this.interactionCount,
        cta_shown: this.session.ctaShown,
        cta_clicked: this.session.ctaClicked,
        engagement_rate: this.calculateEngagementRate()
      });
    }

    const completedSession = { ...this.session };
    this.session = null;
    return completedSession;
  }

  /**
   * Get current session data
   */
  getSession(): DemoSession | null {
    return this.session;
  }

  /**
   * Calculate engagement rate based on interactions
   */
  private calculateEngagementRate(): number {
    if (!this.session) return 0;
    
    const timeSpent = Date.now() - this.session.startTime;
    const interactionsPerMinute = (this.interactionCount / timeSpent) * 60000;
    
    // Normalize to 0-100 scale (assuming 5+ interactions per minute is highly engaged)
    return Math.min(100, (interactionsPerMinute / 5) * 100);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const demoTracker = new DemoTracker();

/**
 * Hook for tracking demo interactions in React components
 */
export function useDemoTracking() {
  const trackHover = (element: string) => {
    demoTracker.trackInteraction('hover', element);
  };

  const trackClick = (element: string) => {
    demoTracker.trackInteraction('click', element);
  };

  const trackView = (element: string) => {
    demoTracker.trackInteraction('view', element);
  };

  const trackCTAShown = () => {
    demoTracker.trackCTAShown();
  };

  const trackCTAClick = () => {
    demoTracker.trackCTAClick();
  };

  return {
    trackHover,
    trackClick,
    trackView,
    trackCTAShown,
    trackCTAClick
  };
}
