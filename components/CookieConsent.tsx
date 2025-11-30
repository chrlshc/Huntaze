/**
 * Cookie Consent Component
 * 
 * GDPR-compliant cookie consent banner.
 * Displays on first visit and stores user preference.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem('analytics_consent');
    
    if (storedConsent !== null) {
      setConsent(storedConsent === 'true');
      setIsVisible(false);
    } else {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    // Store consent
    localStorage.setItem('analytics_consent', String(accepted));
    setConsent(accepted);
    setIsVisible(false);

    // Initialize or disable analytics based on consent
    if (accepted) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }

    // Log consent decision
    console.log('[Cookie Consent]', accepted ? 'Accepted' : 'Rejected');
  };

  const handleWithdrawConsent = () => {
    localStorage.removeItem('analytics_consent');
    setConsent(null);
    setIsVisible(true);
    disableAnalytics();
  };

  // Don't render if consent already given
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">🍪 Cookies et confidentialité</h3>
            <p className="text-sm text-gray-300">
              Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation de notre site.
              Vous pouvez accepter ou refuser les cookies analytiques.
              {' '}
              <a 
                href="/privacy" 
                className="underline hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                En savoir plus
              </a>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleConsent(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={() => handleConsent(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium transition-colors"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Initialize analytics if consent given
 */
function initializeAnalytics() {
  // TODO: Initialize analytics service
  // Example: Google Analytics, Mixpanel, etc.
  console.log('[Analytics] Initialized');
  
  // Set analytics consent flag
  if (typeof window !== 'undefined') {
    (window as any).analyticsConsent = true;
  }
}

/**
 * Disable analytics if consent rejected
 */
function disableAnalytics() {
  // TODO: Disable analytics service
  console.log('[Analytics] Disabled');
  
  // Clear analytics consent flag
  if (typeof window !== 'undefined') {
    (window as any).analyticsConsent = false;
  }
  
  // Clear any existing analytics cookies
  // This is a simplified example - adjust based on your analytics provider
  document.cookie.split(";").forEach((c) => {
    if (c.trim().startsWith('_ga') || c.trim().startsWith('_gid')) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    }
  });
}

/**
 * Check if analytics consent has been given
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  
  const consent = localStorage.getItem('analytics_consent');
  return consent === 'true';
}

/**
 * Withdraw consent (for settings page)
 */
export function withdrawConsent() {
  localStorage.removeItem('analytics_consent');
  disableAnalytics();
}
