import posthog from 'posthog-js';

// Analytics event types
export type AnalyticsEvent = 
  // Onboarding events
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  // Subscription events
  | 'subscription_created'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'subscription_reactivated'
  // Payment events
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_method_added'
  // Feature usage
  | 'ai_message_sent'
  | 'content_created'
  | 'bulk_message_sent'
  | 'analytics_viewed'
  // Security events
  | '2fa_enabled'
  | '2fa_disabled'
  | 'password_changed'
  // Engagement
  | 'feature_discovered'
  | 'support_contacted';

export interface AnalyticsProperties {
  // User properties
  userId?: string;
  email?: string;
  plan?: 'pro' | 'growth' | 'scale' | 'enterprise';
  
  // Event-specific properties
  step?: number;
  stepName?: string;
  duration?: number;
  source?: string;
  feature?: string;
  previousPlan?: string;
  newPlan?: string;
  amount?: number;
  currency?: string;
  error?: string;
  attemptCount?: number;
}

class Analytics {
  private initialized = false;
  private userId: string | null = null;
  private userProperties: AnalyticsProperties = {};

  init() {
    if (this.initialized || !process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        // Opt out of tracking in development
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing();
        }
      },
      autocapture: false, // We'll track specific events
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: false, // Enable session recording for better insights
      mask_all_text: false, // Don't mask text in recordings
      mask_all_element_attributes: false,
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: AnalyticsProperties) {
    if (!this.initialized) return;
    
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };
    
    posthog.identify(userId, {
      ...properties,
      // Add user creation date if available
      created_at: new Date().toISOString(),
    });
  }

  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.initialized) return;

    // Merge with user properties
    const eventProperties = {
      ...this.userProperties,
      ...properties,
      timestamp: new Date().toISOString(),
      source: properties?.source || 'web_app',
    };

    // Add revenue tracking for payment events
    if (event.includes('payment_') && properties?.amount) {
      (eventProperties as any)['$revenue'] = properties.amount / 100; // Convert cents to dollars
    }

    posthog.capture(event, eventProperties);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, eventProperties);
    }
  }

  // Track page views manually for better control
  trackPageView(pageName: string, properties?: AnalyticsProperties) {
    if (!this.initialized) return;
    
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $page_name: pageName,
      ...properties,
    });
  }

  // Track feature discovery/engagement
  trackFeatureEngagement(feature: string, action: 'viewed' | 'used' | 'completed') {
    this.track('feature_discovered', {
      feature,
      // action, // not in AnalyticsProperties type
      // first_time: !this.hasUsedFeature(feature),
    } as any);
    
    // Store feature usage
    this.markFeatureAsUsed(feature);
  }

  // Helper to check if user has used a feature before
  private hasUsedFeature(feature: string): boolean {
    const usedFeatures = localStorage.getItem('usedFeatures');
    if (!usedFeatures) return false;
    
    try {
      const features = JSON.parse(usedFeatures);
      return features.includes(feature);
    } catch {
      return false;
    }
  }

  // Mark feature as used
  private markFeatureAsUsed(feature: string) {
    const usedFeatures = localStorage.getItem('usedFeatures');
    let features: string[] = [];
    
    try {
      features = usedFeatures ? JSON.parse(usedFeatures) : [];
    } catch {
      features = [];
    }
    
    if (!features.includes(feature)) {
      features.push(feature);
      localStorage.setItem('usedFeatures', JSON.stringify(features));
    }
  }

  // Track onboarding funnel
  trackOnboardingStep(step: number, stepName: string, completed: boolean = false) {
    this.track(completed ? 'onboarding_step_completed' : 'onboarding_started', {
      step,
      stepName,
    });
  }

  // Track conversion funnel
  trackConversion(plan: string, billingInterval: 'monthly' | 'yearly', amount: number) {
    this.track('subscription_created', {
      plan: plan as any,
      // billingInterval,
      amount,
      currency: 'USD',
    } as any);
  }

  // Track errors for monitoring
  trackError(error: string, context?: any) {
    if (!this.initialized) return;
    
    posthog.capture('$exception', {
      error,
      context,
      stack_trace: new Error().stack,
    });
  }

  // Group analytics by organization (for B2B)
  setGroup(groupType: string, groupId: string, properties?: any) {
    if (!this.initialized) return;
    
    posthog.group(groupType, groupId, properties);
  }

  // Feature flags
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) return false;
    
    return posthog.isFeatureEnabled(flag) || false;
  }

  // Get feature flag payload
  getFeatureFlagPayload(flag: string): any {
    if (!this.initialized) return null;
    
    return posthog.getFeatureFlagPayload(flag);
  }

  // Reset on logout
  reset() {
    if (!this.initialized) return;
    
    this.userId = null;
    this.userProperties = {};
    posthog.reset();
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Initialize on import
if (typeof window !== 'undefined') {
  analytics.init();
}