/**
 * Property-Based Tests for Abandonment Tracking
 * 
 * Feature: signup-ux-optimization, Property 27: Abandonment Tracking
 * Validates: Requirements 12.2
 * 
 * Tests that form abandonment is properly tracked with field context and time spent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  trackFieldFocus,
  trackFieldBlur,
  trackFieldError,
  setupAbandonmentTracking,
  clearAbandonmentTracking,
  getFieldInteractions,
  getAbandonmentData,
} from '@/lib/analytics/abandonment-tracking';

// Mock sendBeacon
const mockSendBeacon = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
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
  
  // Clear all tracking data
  clearAbandonmentTracking();
});

describe('Abandonment Tracking - Property Tests', () => {
  /**
   * Property 1: Field focus tracking stores field name
   * For any field focus, the system should store the field name
   */
  it('should store field name on focus', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (fieldName) => {
          clearAbandonmentTracking();
          
          trackFieldFocus(fieldName);
          
          const interactions = getFieldInteractions();
          expect(interactions.length).toBe(1);
          expect(interactions[0].fieldName).toBe(fieldName);
          expect(interactions[0].focusTime).toBeTypeOf('number');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 2: Field blur tracking calculates time spent
   * For any field blur, the system should calculate time spent on field
   */
  it('should calculate time spent on field', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        fc.integer({ min: 10, max: 5000 }),
        async (fieldName, valueEntered, delay) => {
          clearAbandonmentTracking();
          
          trackFieldFocus(fieldName);
          
          // Wait for delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          trackFieldBlur(fieldName, valueEntered);
          
          const interactions = getFieldInteractions();
          expect(interactions.length).toBe(1);
          expect(interactions[0].blurTime).toBeTruthy();
          expect(interactions[0].timeSpent).toBeGreaterThanOrEqual(delay - 50); // Allow 50ms tolerance
          expect(interactions[0].valueEntered).toBe(valueEntered);
        }
      ),
      { numRuns: 50 } // Fewer runs due to async delays
    );
  });
  
  /**
   * Property 3: Multiple field interactions are tracked
   * For any sequence of field interactions, all should be tracked
   */
  it('should track multiple field interactions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (fieldNames) => {
          clearAbandonmentTracking();
          
          // Track focus on all fields
          fieldNames.forEach(fieldName => {
            trackFieldFocus(fieldName);
          });
          
          const interactions = getFieldInteractions();
          expect(interactions.length).toBe(fieldNames.length);
          
          // All field names should be tracked
          const trackedFields = interactions.map(i => i.fieldName);
          expect(trackedFields).toEqual(fieldNames);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 4: Error tracking marks field as having error
   * For any field error, the system should mark the field interaction
   */
  it('should mark field as having error', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (fieldName, errorCode, errorMessage) => {
          clearAbandonmentTracking();
          
          trackFieldFocus(fieldName);
          trackFieldError(fieldName, errorCode, errorMessage);
          
          const interactions = getFieldInteractions();
          expect(interactions[0].errorEncountered).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 5: Abandonment data includes all interacted fields
   * For any set of field interactions, abandonment data should list all fields
   */
  it('should include all interacted fields in abandonment data', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (fieldNames) => {
          clearAbandonmentTracking();
          
          // Set session ID
          sessionStorage.setItem('signup_session_id', 'test-session');
          sessionStorage.setItem('signup_form_start_time', Date.now().toString());
          
          // Track all fields
          fieldNames.forEach(fieldName => {
            trackFieldFocus(fieldName);
          });
          
          const data = getAbandonmentData('exit');
          expect(data).toBeTruthy();
          expect(data!.fieldsInteracted.length).toBe(new Set(fieldNames).size);
          
          // All unique field names should be in the list
          fieldNames.forEach(fieldName => {
            expect(data!.fieldsInteracted).toContain(fieldName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 6: Last field is correctly identified
   * For any sequence of field interactions, the last field should be identified
   */
  it('should identify last field correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (fieldNames) => {
          clearAbandonmentTracking();
          
          // Set session ID
          sessionStorage.setItem('signup_session_id', 'test-session');
          sessionStorage.setItem('signup_form_start_time', Date.now().toString());
          
          // Track all fields
          fieldNames.forEach(fieldName => {
            trackFieldFocus(fieldName);
          });
          
          const data = getAbandonmentData('exit');
          expect(data).toBeTruthy();
          expect(data!.lastField).toBe(fieldNames[fieldNames.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 7: Total time on form is calculated
   * For any form session, total time should be calculated
   */
  it('should calculate total time on form', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 5000 }),
        async (fieldName, delay) => {
          clearAbandonmentTracking();
          
          // Set session ID and form start time
          sessionStorage.setItem('signup_session_id', 'test-session');
          const startTime = Date.now();
          sessionStorage.setItem('signup_form_start_time', startTime.toString());
          
          // Wait for delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          trackFieldFocus(fieldName);
          
          const data = getAbandonmentData('exit');
          expect(data).toBeTruthy();
          expect(data!.totalTimeOnForm).toBeGreaterThanOrEqual(delay - 50); // Allow 50ms tolerance
        }
      ),
      { numRuns: 50 } // Fewer runs due to async delays
    );
  });
  
  /**
   * Property 8: Error context is preserved
   * For any field error, the error context should be preserved in abandonment data
   */
  it('should preserve error context', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (fieldName, errorCode, errorMessage) => {
          clearAbandonmentTracking();
          
          // Set session ID
          sessionStorage.setItem('signup_session_id', 'test-session');
          sessionStorage.setItem('signup_form_start_time', Date.now().toString());
          
          trackFieldFocus(fieldName);
          trackFieldError(fieldName, errorCode, errorMessage);
          
          const data = getAbandonmentData('error');
          expect(data).toBeTruthy();
          expect(data!.errorContext).toBeTruthy();
          expect(data!.errorContext!.field).toBe(fieldName);
          expect(data!.errorContext!.errorCode).toBe(errorCode);
          expect(data!.errorContext!.errorMessage).toBe(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 9: Clear tracking removes all data
   * For any tracking state, clearing should remove all stored data
   */
  it('should clear all tracking data', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (fieldNames) => {
          clearAbandonmentTracking();
          
          // Track multiple fields
          fieldNames.forEach(fieldName => {
            trackFieldFocus(fieldName);
          });
          
          // Verify data exists
          expect(getFieldInteractions().length).toBeGreaterThan(0);
          
          // Clear tracking
          clearAbandonmentTracking();
          
          // Verify data is cleared
          expect(getFieldInteractions().length).toBe(0);
          expect(sessionStorage.getItem('signup_current_field')).toBeNull();
          expect(sessionStorage.getItem('signup_last_activity')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 10: Abandonment reason is preserved
   * For any abandonment reason, it should be preserved in the data
   */
  it('should preserve abandonment reason', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('exit', 'navigation', 'timeout', 'error'),
        (fieldName, reason) => {
          clearAbandonmentTracking();
          
          // Set session ID
          sessionStorage.setItem('signup_session_id', 'test-session');
          sessionStorage.setItem('signup_form_start_time', Date.now().toString());
          
          trackFieldFocus(fieldName);
          
          const data = getAbandonmentData(reason);
          expect(data).toBeTruthy();
          expect(data!.abandonmentReason).toBe(reason);
        }
      ),
      { numRuns: 100 }
    );
  });
});
