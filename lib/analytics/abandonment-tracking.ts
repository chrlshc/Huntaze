/**
 * Signup Form Abandonment Tracking
 * 
 * Tracks when and where users abandon the signup form to identify
 * friction points and optimize the conversion funnel.
 * 
 * Feature: signup-ux-optimization, Property 27: Abandonment Tracking
 * Validates: Requirements 12.2
 */

export interface FieldInteraction {
  fieldName: string;
  focusTime: number;
  blurTime?: number;
  timeSpent?: number; // milliseconds
  valueEntered: boolean;
  errorEncountered: boolean;
}

export interface AbandonmentData {
  sessionId: string;
  lastField: string;
  timeSpentOnField: number;
  totalTimeOnForm: number;
  fieldsInteracted: string[];
  fieldInteractions: FieldInteraction[];
  abandonmentReason?: 'exit' | 'navigation' | 'timeout' | 'error';
  errorContext?: {
    field: string;
    errorCode: string;
    errorMessage: string;
  };
}

// Storage keys
const STORAGE_KEYS = {
  FIELD_INTERACTIONS: 'signup_field_interactions',
  FORM_START_TIME: 'signup_form_start_time',
  CURRENT_FIELD: 'signup_current_field',
  LAST_ACTIVITY: 'signup_last_activity',
} as const;

// Timeout for inactivity (5 minutes)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

/**
 * Get stored field interactions
 */
function getFieldInteractions(): FieldInteraction[] {
  if (typeof window === 'undefined') return [];
  
  const stored = sessionStorage.getItem(STORAGE_KEYS.FIELD_INTERACTIONS);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Store field interactions
 */
function setFieldInteractions(interactions: FieldInteraction[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.FIELD_INTERACTIONS, JSON.stringify(interactions));
}

/**
 * Track field focus event
 */
export function trackFieldFocus(fieldName: string): void {
  if (typeof window === 'undefined') return;
  
  const interactions = getFieldInteractions();
  const timestamp = Date.now();
  
  // Store current field
  sessionStorage.setItem(STORAGE_KEYS.CURRENT_FIELD, fieldName);
  sessionStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString());
  
  // Add new interaction
  interactions.push({
    fieldName,
    focusTime: timestamp,
    valueEntered: false,
    errorEncountered: false,
  });
  
  setFieldInteractions(interactions);
}

/**
 * Track field blur event
 */
export function trackFieldBlur(fieldName: string, valueEntered: boolean): void {
  if (typeof window === 'undefined') return;
  
  const interactions = getFieldInteractions();
  const timestamp = Date.now();
  
  // Update last activity
  sessionStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString());
  
  // Find the most recent interaction for this field
  const lastInteraction = [...interactions]
    .reverse()
    .find(i => i.fieldName === fieldName && !i.blurTime);
  
  if (lastInteraction) {
    lastInteraction.blurTime = timestamp;
    lastInteraction.timeSpent = timestamp - lastInteraction.focusTime;
    lastInteraction.valueEntered = valueEntered;
    setFieldInteractions(interactions);
  }
}

/**
 * Track field error
 */
export function trackFieldError(fieldName: string, errorCode: string, errorMessage: string): void {
  if (typeof window === 'undefined') return;
  
  const interactions = getFieldInteractions();
  
  // Find the most recent interaction for this field
  const lastInteraction = [...interactions]
    .reverse()
    .find(i => i.fieldName === fieldName);
  
  if (lastInteraction) {
    lastInteraction.errorEncountered = true;
    setFieldInteractions(interactions);
  }
  
  // Store error context for abandonment report
  sessionStorage.setItem('signup_last_error', JSON.stringify({
    field: fieldName,
    errorCode,
    errorMessage,
  }));
}

/**
 * Check for inactivity timeout
 */
function checkInactivityTimeout(): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastActivity = sessionStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  if (!lastActivity) return false;
  
  const timeSinceActivity = Date.now() - parseInt(lastActivity);
  return timeSinceActivity > INACTIVITY_TIMEOUT;
}

/**
 * Get abandonment data
 */
function getAbandonmentData(reason: AbandonmentData['abandonmentReason']): AbandonmentData | null {
  if (typeof window === 'undefined') return null;
  
  const interactions = getFieldInteractions();
  if (interactions.length === 0) return null;
  
  const sessionId = sessionStorage.getItem('signup_session_id') || '';
  const formStartTime = sessionStorage.getItem(STORAGE_KEYS.FORM_START_TIME);
  const currentField = sessionStorage.getItem(STORAGE_KEYS.CURRENT_FIELD) || '';
  const lastErrorStr = sessionStorage.getItem('signup_last_error');
  
  // Calculate time spent on last field
  const lastInteraction = interactions[interactions.length - 1];
  const timeSpentOnField = lastInteraction.blurTime
    ? lastInteraction.timeSpent || 0
    : Date.now() - lastInteraction.focusTime;
  
  // Calculate total time on form
  const totalTimeOnForm = formStartTime
    ? Date.now() - parseInt(formStartTime)
    : 0;
  
  // Get unique fields interacted with
  const fieldsInteracted = [...new Set(interactions.map(i => i.fieldName))];
  
  // Parse error context
  let errorContext: AbandonmentData['errorContext'];
  if (lastErrorStr) {
    try {
      errorContext = JSON.parse(lastErrorStr);
    } catch {
      // Ignore parse errors
    }
  }
  
  return {
    sessionId,
    lastField: currentField || lastInteraction.fieldName,
    timeSpentOnField,
    totalTimeOnForm,
    fieldsInteracted,
    fieldInteractions: interactions,
    abandonmentReason: reason,
    errorContext,
  };
}

/**
 * Send abandonment data to analytics
 */
async function sendAbandonmentData(data: AbandonmentData): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/abandonment', blob);
    } else {
      await fetch('/api/analytics/abandonment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Abandonment tracking error:', error);
  }
}

/**
 * Track form abandonment on page unload
 */
export function setupAbandonmentTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  // Track exit intent (beforeunload)
  const handleBeforeUnload = () => {
    const data = getAbandonmentData('exit');
    if (data) {
      sendAbandonmentData(data);
    }
  };
  
  // Track navigation away (pagehide)
  const handlePageHide = () => {
    const data = getAbandonmentData('navigation');
    if (data) {
      sendAbandonmentData(data);
    }
  };
  
  // Track inactivity timeout
  const timeoutCheckInterval = setInterval(() => {
    if (checkInactivityTimeout()) {
      const data = getAbandonmentData('timeout');
      if (data) {
        sendAbandonmentData(data);
        // Clear interactions after reporting timeout
        sessionStorage.removeItem(STORAGE_KEYS.FIELD_INTERACTIONS);
      }
    }
  }, 60000); // Check every minute
  
  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
    clearInterval(timeoutCheckInterval);
  };
}

/**
 * Clear abandonment tracking data (call on successful signup)
 */
export function clearAbandonmentTracking(): void {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem(STORAGE_KEYS.FIELD_INTERACTIONS);
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_FIELD);
  sessionStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  sessionStorage.removeItem('signup_last_error');
}

/**
 * React hook for abandonment tracking
 */
export function useAbandonmentTracking() {
  const isClient = typeof window !== 'undefined';
  
  // Setup tracking on mount
  React.useEffect(() => {
    if (!isClient) return;
    const cleanup = setupAbandonmentTracking();
    return cleanup;
  }, [isClient]);

  if (!isClient) {
    return {
      trackFieldFocus: () => {},
      trackFieldBlur: () => {},
      trackFieldError: () => {},
      clearTracking: () => {},
    };
  }
  
  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldError,
    clearTracking: clearAbandonmentTracking,
  };
}

// Export for testing
export { getFieldInteractions, getAbandonmentData };
