/**
 * Property-Based Tests for Signup Analytics Tracking
 * 
 * Feature: signup-ux-optimization, Property 26: Analytics Event Tracking
 * Validates: Requirements 12.1
 * 
 * Tests that all signup funnel events are properly tracked with correct data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  trackSignupPageView,
  trackSignupFormStart,
  trackSignupMethodSelected,
  trackSignupFormSubmit,
  trackSignupSuccess,
  trackSignupError,
  type SignupMethod,
} from '@/lib/analytics/signup-tracking';

// Mock fetch and sendBeacon
const mockFetch = vi.fn();
const mockSendBeacon = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock global fetch
  global.fetch = mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });
  
  // Mock navigator.sendBeacon
  Object.defineProperty(global.navigator, 'sendBeacon', {
    value: mockSendBeacon.mockReturnValue(true),
    writable: true,
  });
  
  // Mock sessionStorage
  const storage: Record<string, string> = {};
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    },
    writable: true,
  });
  
  // Mock window.location
  Object.defineProperty(global, 'window', {
    value: {
      location: {
        pathname: '/signup',
        search: '',
      },
    },
    writable: true,
  });
  
  // Mock document
  Object.defineProperty(global, 'document', {
    value: {
      referrer: '',
    },
    writable: true,
  });
});

describe('Signup Analytics Tracking - Property Tests', () => {
  /**
   * Property 1: Page view tracking always sends event
   * For any page view, the system should send a tracking event
   */
  it('should always send page view event', () => {
    fc.assert(
      fc.property(
        fc.record({
          referrer: fc.option(fc.webUrl(), { nil: undefined }),
          utmSource: fc.option(fc.string(), { nil: undefined }),
          utmMedium: fc.option(fc.string(), { nil: undefined }),
          utmCampaign: fc.option(fc.string(), { nil: undefined }),
        }),
        (data) => {
          mockSendBeacon.mockClear();
          
          trackSignupPageView(data);
          
          // Should call sendBeacon
          expect(mockSendBeacon).toHaveBeenCalledTimes(1);
          
          // Should send to correct endpoint
          const [url] = mockSendBeacon.mock.calls[0];
          expect(url).toBe('/api/analytics/signup');
          
          // Should include event data
          const [, blob] = mockSendBeacon.mock.calls[0];
          const text = new TextDecoder().decode(await blob.arrayBuffer());
          const eventData = JSON.parse(text);
          
          expect(eventData.event).toBe('signup_page_viewed');
          expect(eventData.sessionId).toBeTruthy();
          expect(eventData.timestamp).toBeTypeOf('number');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 2: Form start tracking stores timestamp
   * For any form start, the system should store the start time
   */
  it('should store form start timestamp', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          const beforeTime = Date.now();
          trackSignupFormStart();
          const afterTime = Date.now();
          
          // Should store timestamp in session storage
          const storedTime = sessionStorage.getItem('signup_form_start_time');
          expect(storedTime).toBeTruthy();
          
          const timestamp = parseInt(storedTime!);
          expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
          expect(timestamp).toBeLessThanOrEqual(afterTime);
          
          // Should send event
          expect(mockSendBeacon).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 3: Method selection tracking stores method
   * For any method selection, the system should store the selected method
   */
  it('should store selected method', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        fc.integer({ min: 0, max: 10000 }),
        (method, timeToSelect) => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          trackSignupMethodSelected({ method, timeToSelect });
          
          // Should store method in session storage
          const storedMethod = sessionStorage.getItem('signup_selected_method');
          expect(storedMethod).toBe(method);
          
          // Should send event with method
          const [, blob] = mockSendBeacon.mock.calls[0];
          const text = new TextDecoder().decode(await blob.arrayBuffer());
          const eventData = JSON.parse(text);
          
          expect(eventData.metadata.method).toBe(method);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 4: Form submit tracking includes time to submit
   * For any form submission, the system should calculate time to submit
   */
  it('should calculate time to submit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 100, max: 60000 }),
        (method, fieldsFilled, delay) => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          // Set form start time
          const startTime = Date.now() - delay;
          sessionStorage.setItem('signup_form_start_time', startTime.toString());
          
          trackSignupFormSubmit({
            method,
            fieldsFilled,
            timeToSubmit: delay,
          });
          
          // Should send event with time to submit
          const [, blob] = mockSendBeacon.mock.calls[0];
          const text = new TextDecoder().decode(await blob.arrayBuffer());
          const eventData = JSON.parse(text);
          
          expect(eventData.metadata.timeToSubmit).toBeGreaterThan(0);
          expect(eventData.metadata.fieldsFilled).toEqual(fieldsFilled);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 5: Success tracking clears session storage
   * For any successful signup, the system should clear session storage
   */
  it('should clear session storage on success', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        fc.emailAddress(),
        fc.uuid(),
        fc.integer({ min: 1000, max: 300000 }),
        (method, email, userId, timeToComplete) => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          // Set some session data
          sessionStorage.setItem('signup_session_id', 'test-session');
          sessionStorage.setItem('signup_page_view_time', Date.now().toString());
          sessionStorage.setItem('signup_form_start_time', Date.now().toString());
          sessionStorage.setItem('signup_selected_method', method);
          
          trackSignupSuccess({
            method,
            email,
            userId,
            timeToComplete,
          });
          
          // Should clear all session storage
          expect(sessionStorage.getItem('signup_session_id')).toBeNull();
          expect(sessionStorage.getItem('signup_page_view_time')).toBeNull();
          expect(sessionStorage.getItem('signup_form_start_time')).toBeNull();
          expect(sessionStorage.getItem('signup_selected_method')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 6: Error tracking includes error details
   * For any signup error, the system should track error code and message
   */
  it('should track error details', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.option(fc.string(), { nil: undefined }),
        fc.integer({ min: 0, max: 60000 }),
        (errorCode, errorMessage, errorField, timeToError) => {
          mockSendBeacon.mockClear();
          
          trackSignupError({
            errorCode,
            errorMessage,
            errorField,
            timeToError,
          });
          
          // Should send event with error details
          const [, blob] = mockSendBeacon.mock.calls[0];
          const text = new TextDecoder().decode(await blob.arrayBuffer());
          const eventData = JSON.parse(text);
          
          expect(eventData.metadata.errorCode).toBe(errorCode);
          expect(eventData.metadata.errorMessage).toBe(errorMessage);
          if (errorField) {
            expect(eventData.metadata.errorField).toBe(errorField);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 7: Session ID consistency
   * For any sequence of events in the same session, the session ID should remain the same
   */
  it('should maintain consistent session ID', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        (method) => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          // Track multiple events
          trackSignupPageView();
          trackSignupFormStart();
          trackSignupMethodSelected({ method, timeToSelect: 1000 });
          
          // Extract session IDs from all events
          const sessionIds = mockSendBeacon.mock.calls.map(call => {
            const [, blob] = call;
            const text = new TextDecoder().decode(blob);
            const eventData = JSON.parse(text);
            return eventData.sessionId;
          });
          
          // All session IDs should be the same
          const uniqueSessionIds = new Set(sessionIds);
          expect(uniqueSessionIds.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 8: Timestamp ordering
   * For any sequence of events, timestamps should be in chronological order
   */
  it('should maintain chronological timestamp order', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        async (method) => {
          sessionStorage.clear();
          mockSendBeacon.mockClear();
          
          // Track events with small delays
          trackSignupPageView();
          await new Promise(resolve => setTimeout(resolve, 10));
          
          trackSignupFormStart();
          await new Promise(resolve => setTimeout(resolve, 10));
          
          trackSignupMethodSelected({ method, timeToSelect: 1000 });
          
          // Extract timestamps
          const timestamps = mockSendBeacon.mock.calls.map(call => {
            const [, blob] = call;
            const text = new TextDecoder().decode(blob);
            const eventData = JSON.parse(text);
            return eventData.timestamp;
          });
          
          // Timestamps should be in ascending order
          for (let i = 1; i < timestamps.length; i++) {
            expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs due to async delays
    );
  });
  
  /**
   * Property 9: UTM parameter extraction
   * For any URL with UTM parameters, the system should extract them correctly
   */
  it('should extract UTM parameters from URL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (utmSource, utmMedium, utmCampaign) => {
          mockSendBeacon.mockClear();
          
          // Set URL with UTM parameters
          window.location.search = `?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
          
          trackSignupPageView();
          
          // Should extract UTM parameters
          const [, blob] = mockSendBeacon.mock.calls[0];
          const text = new TextDecoder().decode(blob);
          const eventData = JSON.parse(text);
          
          expect(eventData.metadata.utmSource).toBe(utmSource);
          expect(eventData.metadata.utmMedium).toBe(utmMedium);
          expect(eventData.metadata.utmCampaign).toBe(utmCampaign);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 10: Graceful failure
   * For any tracking error, the system should not throw exceptions
   */
  it('should handle tracking errors gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SignupMethod>('email', 'google', 'apple'),
        (method) => {
          // Make sendBeacon fail
          mockSendBeacon.mockReturnValue(false);
          mockFetch.mockRejectedValue(new Error('Network error'));
          
          // Should not throw
          expect(() => {
            trackSignupPageView();
            trackSignupFormStart();
            trackSignupMethodSelected({ method, timeToSelect: 1000 });
            trackSignupError({
              errorCode: 'TEST_ERROR',
              errorMessage: 'Test error',
              timeToError: 1000,
            });
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
