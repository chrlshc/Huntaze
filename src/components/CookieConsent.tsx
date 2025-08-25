'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart3, X } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Apply saved preferences
      try {
        const savedPrefs = JSON.parse(consent);
        applyPreferences(savedPrefs);
      } catch (e) {
        console.error('Failed to parse cookie preferences');
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Apply analytics preference
    if (!prefs.analytics) {
      // Opt out of PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.opt_out_capturing();
      }
    } else {
      // Opt in to PostHog
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.opt_in_capturing();
      }
    }

    // Apply marketing preference
    if (!prefs.marketing) {
      // Disable marketing cookies/scripts
      // e.g., Google Ads, Facebook Pixel
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    
    savePreferences(allAccepted);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    
    savePreferences(onlyNecessary);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    // Apply preferences
    applyPreferences(prefs);
    
    // Track consent (only if analytics is accepted)
    if (prefs.analytics) {
      // Track consent event - commented out for now
      // analytics.track('cookie_consent_given', {
      //   analytics: prefs.analytics,
      //   marketing: prefs.marketing,
      // });
    }
    
    // Hide banner
    setIsVisible(false);
  };

  const togglePreference = (type: 'analytics' | 'marketing') => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 mb-4 lg:mb-0 lg:mr-8">
            <div className="flex items-center mb-2">
              <Cookie className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cookie Preferences
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
              You can customize your preferences below.
            </p>
            
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="text-sm text-purple-600 hover:text-purple-700 mt-2 underline"
              >
                Customize preferences
              </button>
            )}
          </div>
          
          {!showDetails ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="btn-primary text-sm"
              >
                Accept All
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDetails(false)}
              className="lg:hidden absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {showDetails && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Cookie Categories
              </h4>
              
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-gray-600 mr-2" />
                    <h5 className="text-sm font-medium text-gray-900">
                      Necessary Cookies
                    </h5>
                    <span className="ml-2 text-xs text-gray-500">Always Active</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Essential for the website to function properly. These include security, 
                    authentication, and site functionality cookies.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 text-purple-600 rounded cursor-not-allowed opacity-50"
                  />
                </div>
              </div>
              
              {/* Analytics Cookies */}
              <div className="flex items-start justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 text-gray-600 mr-2" />
                    <h5 className="text-sm font-medium text-gray-900">
                      Analytics Cookies
                    </h5>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Help us understand how visitors interact with our website by collecting 
                    anonymous information. Powers features like session recordings and heatmaps.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => togglePreference('analytics')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Marketing Cookies */}
              <div className="flex items-start justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Cookie className="w-4 h-4 text-gray-600 mr-2" />
                    <h5 className="text-sm font-medium text-gray-900">
                      Marketing Cookies
                    </h5>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Used to track visitors across websites to display relevant advertisements. 
                    Currently not in use but reserved for future marketing campaigns.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => togglePreference('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
              <button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptSelected}
                className="btn-primary text-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check cookie consent
export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      try {
        const prefs = JSON.parse(consent);
        setPreferences(prefs);
        setHasConsent(true);
      } catch {
        setHasConsent(false);
      }
    } else {
      setHasConsent(false);
    }
  }, []);

  const updateConsent = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(newPreferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setPreferences(newPreferences);
    setHasConsent(true);
  };

  return { hasConsent, preferences, updateConsent };
}