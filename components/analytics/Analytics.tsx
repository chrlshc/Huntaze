'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * Analytics Component
 * 
 * Client-side analytics component that respects user privacy preferences:
 * - Checks Do Not Track (DNT) headers
 * - Respects GDPR consent preferences
 * - Uses first-party proxy to bypass ad-blockers
 * - Non-blocking load strategy
 * 
 * Validates: Requirements 6.4
 */
export function Analytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Respect Do Not Track (DNT) header - Requirement 6.4
    const dnt = navigator.doNotTrack || 
                (window as any).doNotTrack || 
                (navigator as any).msDoNotTrack;
    
    // Check for GDPR consent (if consent management is implemented)
    // Defaults to true if no explicit rejection
    let hasConsent = true;
    try {
      const consentValue = localStorage.getItem('analytics-consent');
      hasConsent = consentValue !== 'false';
    } catch (error) {
      // localStorage unavailable (private browsing) - default to not loading
      hasConsent = false;
    }
    
    // Only load analytics if DNT is not enabled and user has consented
    // DNT can be '1', 'yes', or true depending on browser
    const dntEnabled = dnt === '1' || dnt === 'yes' || dnt === true;
    
    if (!dntEnabled && hasConsent) {
      setShouldLoad(true);
    }
  }, []);

  // Don't render anything if analytics should not load
  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      src="/stats/js/script.js"
      data-domain="huntaze.com"
      data-api="/stats/api/event"
      strategy="afterInteractive"
    />
  );
}
