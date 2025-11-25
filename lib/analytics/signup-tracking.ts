/**
 * Signup Funnel Analytics Tracking
 * 
 * Tracks user behavior through the signup funnel to identify
 * drop-off points and optimize conversion rates.
 * 
 * Events tracked:
 * - Page view
 * - Form start (first input focus)
 * - Method selection (email, Google, Apple)
 * - Form submit
 * - Signup success
 * - Signup error
 */

// Event types
export type SignupEvent =
  | 'signup_page_viewed'
  | 'signup_form_started'
  | 'signup_method_selected'
  | 'signup_form_submitted'
  | 'signup_success'
  | 'signup_error';

export type SignupMethod = 'email' | 'google' | 'apple';

// Event data interfaces
export interface SignupEventData {
  event: SignupEvent;
  timestamp: number;
  sessionId: string;
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface SignupPageViewData {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
}

export interface SignupMethodSelectedData {
  method: SignupMethod;
  timeToSelect: number; // milliseconds from page load
}

export interface SignupFormSubmittedData {
  method: SignupMethod;
  timeToSubmit: number; // milliseconds from form start
  fieldsFilled: string[];
}

export interface SignupSuccessData {
  method: SignupMethod;
  timeToComplete: number; // milliseconds from page view
  userId: string;
  email: string;
}

export interface SignupErrorData {
  method?: SignupMethod;
  errorCode: string;
  errorMessage: string;
  errorField?: string;
  timeToError: number; // milliseconds from page view
}

// Session storage keys
const SESSION_KEYS = {
  SESSION_ID: 'signup_session_id',
  PAGE_VIEW_TIME: 'signup_page_view_time',
  FORM_START_TIME: 'signup_form_start_time',
  SELECTED_METHOD: 'signup_selected_method',
} as const;

/**
 * Generate a unique session ID for tracking
 */
function generateSessionId(): string {
  return `signup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

/**
 * Get device and browser information
 */
function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      deviceType: 'unknown',
      browser: 'unknown',
      os: 'unknown',
    };
  }

  const ua = navigator.userAgent;
  
  // Detect device type
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  
  // Detect browser
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'chrome';
  else if (ua.includes('Safari')) browser = 'safari';
  else if (ua.includes('Firefox')) browser = 'firefox';
  else if (ua.includes('Edge')) browser = 'edge';
  
  // Detect OS
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'windows';
  else if (ua.includes('Mac')) os = 'macos';
  else if (ua.includes('Linux')) os = 'linux';
  else if (ua.includes('Android')) os = 'android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';
  
  return {
    userAgent: ua,
    deviceType,
    browser,
    os,
  };
}

/**
 * Send analytics event to backend
 */
async function sendAnalyticsEvent(data: SignupEventData): Promise<void> {
  try {
    // In production, this would send to your analytics service
    // For now, we'll use the browser's sendBeacon API for reliability
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/signup', blob);
    } else {
      // Fallback to fetch
      await fetch('/api/analytics/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.error('Analytics error:', error);
  }
}

/**
 * Track signup page view
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupPageView(data?: SignupPageViewData): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  // Store page view time for later calculations
  sessionStorage.setItem(SESSION_KEYS.PAGE_VIEW_TIME, timestamp.toString());
  
  // Get UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || data?.utmSource;
  const utmMedium = urlParams.get('utm_medium') || data?.utmMedium;
  const utmCampaign = urlParams.get('utm_campaign') || data?.utmCampaign;
  
  sendAnalyticsEvent({
    event: 'signup_page_viewed',
    timestamp,
    sessionId,
    metadata: {
      ...getDeviceInfo(),
      referrer: document.referrer || data?.referrer,
      landingPage: window.location.pathname,
      utmSource,
      utmMedium,
      utmCampaign,
    },
  });
}

/**
 * Track form start (first input focus)
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupFormStart(): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  // Store form start time for later calculations
  sessionStorage.setItem(SESSION_KEYS.FORM_START_TIME, timestamp.toString());
  
  const pageViewTime = sessionStorage.getItem(SESSION_KEYS.PAGE_VIEW_TIME);
  const timeToStart = pageViewTime ? timestamp - parseInt(pageViewTime) : 0;
  
  sendAnalyticsEvent({
    event: 'signup_form_started',
    timestamp,
    sessionId,
    metadata: {
      timeToStart,
    },
  });
}

/**
 * Track method selection (email, Google, Apple)
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupMethodSelected(data: SignupMethodSelectedData): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  // Store selected method for later events
  sessionStorage.setItem(SESSION_KEYS.SELECTED_METHOD, data.method);
  
  const pageViewTime = sessionStorage.getItem(SESSION_KEYS.PAGE_VIEW_TIME);
  const timeToSelect = pageViewTime ? timestamp - parseInt(pageViewTime) : data.timeToSelect;
  
  sendAnalyticsEvent({
    event: 'signup_method_selected',
    timestamp,
    sessionId,
    metadata: {
      method: data.method,
      timeToSelect,
    },
  });
}

/**
 * Track form submission
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupFormSubmit(data: SignupFormSubmittedData): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  const formStartTime = sessionStorage.getItem(SESSION_KEYS.FORM_START_TIME);
  const timeToSubmit = formStartTime ? timestamp - parseInt(formStartTime) : data.timeToSubmit;
  
  sendAnalyticsEvent({
    event: 'signup_form_submitted',
    timestamp,
    sessionId,
    metadata: {
      method: data.method,
      timeToSubmit,
      fieldsFilled: data.fieldsFilled,
    },
  });
}

/**
 * Track signup success
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupSuccess(data: SignupSuccessData): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  const pageViewTime = sessionStorage.getItem(SESSION_KEYS.PAGE_VIEW_TIME);
  const timeToComplete = pageViewTime ? timestamp - parseInt(pageViewTime) : data.timeToComplete;
  
  sendAnalyticsEvent({
    event: 'signup_success',
    timestamp,
    sessionId,
    userId: data.userId,
    email: data.email,
    metadata: {
      method: data.method,
      timeToComplete,
    },
  });
  
  // Clear session storage after successful signup
  Object.values(SESSION_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
}

/**
 * Track signup error
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 */
export function trackSignupError(data: SignupErrorData): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getSessionId();
  const timestamp = Date.now();
  
  const pageViewTime = sessionStorage.getItem(SESSION_KEYS.PAGE_VIEW_TIME);
  const timeToError = pageViewTime ? timestamp - parseInt(pageViewTime) : data.timeToError;
  
  const method = data.method || sessionStorage.getItem(SESSION_KEYS.SELECTED_METHOD) as SignupMethod;
  
  sendAnalyticsEvent({
    event: 'signup_error',
    timestamp,
    sessionId,
    metadata: {
      method,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      errorField: data.errorField,
      timeToError,
    },
  });
}

/**
 * Hook for tracking signup funnel in React components
 */
export function useSignupTracking() {
  return {
    trackPageView: trackSignupPageView,
    trackFormStart: trackSignupFormStart,
    trackMethodSelected: trackSignupMethodSelected,
    trackFormSubmit: trackSignupFormSubmit,
    trackSuccess: trackSignupSuccess,
    trackError: trackSignupError,
  };
}
