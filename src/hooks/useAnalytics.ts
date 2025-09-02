'use client';

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = (
    eventName: string,
    parameters?: Record<string, any>
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  // Backwards-compatible alias
  const track = trackEvent;

  const identify = (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', { user_id: userId, ...(traits || {}) });
    }
  };

  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        page_path: url,
      });
    }
  };

  const trackPurchase = (value: number, currency: string = 'USD', items?: any[]) => {
    trackEvent('purchase', {
      currency,
      value,
      items,
    });
  };

  const trackSignUp = (method: string) => {
    trackEvent('sign_up', {
      method,
    });
  };

  const trackPlatformConnect = (platform: string, success: boolean) => {
    trackEvent('platform_connect', {
      category: 'engagement',
      label: platform,
      value: success ? 1 : 0,
    });
  };

  return {
    trackEvent,
    track,
    identify,
    trackPageView,
    trackPurchase,
    trackSignUp,
    trackPlatformConnect,
  };
};
