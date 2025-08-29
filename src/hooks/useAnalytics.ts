import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics, AnalyticsEvent, AnalyticsProperties } from '@/lib/analytics';

export function useAnalytics() {
  const pathname = usePathname();

  // Track page views on route change
  useEffect(() => {
    const pageName = getPageName(pathname);
    analytics.trackPageView(pageName);
  }, [pathname]);

  const track = useCallback((event: AnalyticsEvent, properties?: AnalyticsProperties) => {
    analytics.track(event, properties);
  }, []);

  const trackOnboardingStep = useCallback((step: number, stepName: string, completed: boolean = false) => {
    analytics.trackOnboardingStep(step, stepName, completed);
  }, []);

  const trackConversion = useCallback((plan: string, billingInterval: 'monthly' | 'yearly', amount: number) => {
    analytics.trackConversion(plan, billingInterval, amount);
  }, []);

  const trackFeatureEngagement = useCallback((feature: string, action: 'viewed' | 'used' | 'completed') => {
    analytics.trackFeatureEngagement(feature, action);
  }, []);

  const trackError = useCallback((error: string, context?: any) => {
    analytics.trackError(error, context);
  }, []);

  const identify = useCallback((userId: string, properties?: AnalyticsProperties) => {
    analytics.identify(userId, properties);
  }, []);

  const isFeatureEnabled = useCallback((flag: string): boolean => {
    return analytics.isFeatureEnabled(flag);
  }, []);

  return {
    track,
    trackOnboardingStep,
    trackConversion,
    trackFeatureEngagement,
    trackError,
    identify,
    isFeatureEnabled,
  };
}

// Helper to get page name from pathname
function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/login': 'Login',
    '/register': 'Register',
    '/onboarding': 'Onboarding',
    '/dashboard': 'Dashboard',
    '/analytics': 'Analytics',
    '/messages': 'Messages',
    '/fans': 'Fans',
    '/automations': 'Automations',
    '/campaigns': 'Campaigns',
    '/billing': 'Billing',
    '/platforms/connect': 'Connect Platforms',
    '/dashboard/content': 'Content',
    '/dashboard/earnings': 'Earnings',
    '/dashboard/dmca': 'DMCA',
    '/dashboard/settings': 'Settings',
    '/dashboard/settings/security': 'Security Settings',
  };

  return routes[pathname] || pathname;
}

// Hook for tracking onboarding progress
export function useOnboardingAnalytics() {
  const { trackOnboardingStep, trackConversion, track } = useAnalytics();
  const startTime = Date.now();

  const trackStepCompleted = useCallback((step: number, stepName: string) => {
    const duration = Date.now() - startTime;
    trackOnboardingStep(step, stepName, true);
    
    // Track time spent on each step
    track('onboarding_step_completed', {
      step,
      stepName,
      duration,
    });
  }, [trackOnboardingStep, track, startTime]);

  const trackOnboardingCompleted = useCallback((plan: string, billingInterval: 'monthly' | 'yearly', amount: number) => {
    const totalDuration = Date.now() - startTime;
    
    track('onboarding_completed', {
      duration: totalDuration,
      plan: plan as any,
      // billingInterval, // removed as it's not in AnalyticsProperties type
    });
    
    trackConversion(plan, billingInterval, amount);
  }, [track, trackConversion, startTime]);

  const trackOnboardingAbandoned = useCallback((step: number, stepName: string) => {
    const duration = Date.now() - startTime;
    
    track('onboarding_abandoned', {
      step,
      stepName,
      duration,
    });
  }, [track, startTime]);

  return {
    trackStepCompleted,
    trackOnboardingCompleted,
    trackOnboardingAbandoned,
  };
}
