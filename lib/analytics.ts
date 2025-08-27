// Simplified analytics without PostHog for now

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

    // PostHog initialization disabled for now
    console.log('[Analytics] Initialized (mock mode)');

    this.initialized = true;
  }

  identify(userId: string, properties?: AnalyticsProperties) {
    if (!this.initialized) return;
    
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };
    
    // Mock identify
    console.log('[Analytics] Identify:', userId, properties);
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

    // Mock capture
    console.log('[Analytics] Track:', event, eventProperties);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, eventProperties);
    }
  }

  // Track page views manually for better control
  trackPageView(pageName: string, properties?: AnalyticsProperties) {
    if (!this.initialized) return;
    
    // Mock pageview
    console.log('[Analytics] Page view:', pageName, properties);
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

  // Compatibility helpers used by hooks
  trackOnboardingStep(step: number, stepName: string, completed: boolean = false) {
    this.track('onboarding_step_completed', {
      step,
      stepName,
      ...(completed ? { completed: true } : {}),
    } as any);
  }

  trackConversion(plan: string, billingInterval: 'monthly' | 'yearly', amount: number) {
    this.track('payment_succeeded', {
      plan: plan as any,
      amount,
      currency: 'usd',
      // billingInterval not in AnalyticsProperties type; omit
    });
  }

  trackError(error: string, context?: any) {
    console.error('[Analytics] Error:', error, context);
  }

  isFeatureEnabled(flag: string): boolean {
    // Simple stub for feature flags; return true by default
    return true;
  }

  // Helper to check if user has used a feature before
  private hasUsedFeature(feature: string): boolean {
    const usedFeatures = localStorage.getItem('usedFeatures');
    if (!usedFeatures) return false;
    
    try {
      const features = JSON.parse(usedFeatures);
      return Array.isArray(features) && features.includes(feature);
    } catch {
      return false;
    }
  }

  // Helper to mark a feature as used
  private markFeatureAsUsed(feature: string) {
    const usedFeatures = localStorage.getItem('usedFeatures');
    let features: string[] = [];
    
    try {
      features = usedFeatures ? JSON.parse(usedFeatures) : [];
      if (!Array.isArray(features)) features = [];
    } catch {
      features = [];
    }
    
    if (!features.includes(feature)) {
      features.push(feature);
      localStorage.setItem('usedFeatures', JSON.stringify(features));
    }
  }
}

export const analytics = new Analytics();
