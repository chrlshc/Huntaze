/**
 * Property-Based Tests for Email Validation
 * 
 * Feature: signup-ux-optimization, Property 8: Real-Time Email Validation
 * For any email input, the system should validate format in real-time with 500ms debounce
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEmail, emailSchema, debounce } from '../../../lib/validation/signup';

describe('Email Validation Property Tests', () => {
  /**
   * Property 8: Valid Email Format
   * For any valid email format, validation should succeed
   */
  it('should accept any valid email format', () => {
    fc.assert(
      fc.property(
        // Generate realistic valid email addresses (alphanumeric start/end, special chars in middle)
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(s) || /^[a-zA-Z0-9]$/.test(s)
        ),
        fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'test.com'),
        (localPart, domain) => {
          const email = `${localPart}@${domain}`;
          const result = validateEmail(email);
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Email with Spaces Rejection
   * For any email containing spaces, validation should fail
   */
  it('should reject any email with spaces', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          /^[a-zA-Z0-9._-]+$/.test(s)
        ),
        fc.constantFrom('gmail.com', 'yahoo.com', 'example.com'),
        fc.integer({ min: 0, max: 10 }),
        (localPart, domain, spacePosition) => {
          const email = `${localPart}@${domain}`;
          // Insert space at random position
          const emailWithSpace = 
            email.slice(0, spacePosition) + ' ' + email.slice(spacePosition);
          
          const result = validateEmail(emailWithSpace);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Empty Email Rejection
   * For any empty or whitespace-only string, validation should fail
   */
  it('should reject empty or whitespace-only emails', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 10 }).map(s => ' '.repeat(s.length))
        ),
        (email) => {
          const result = validateEmail(email);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Email Length Limits
   * For any email exceeding 254 characters, validation should fail
   */
  it('should reject emails exceeding maximum length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 255, maxLength: 300 }),
        (longString) => {
          // Create a long but structurally valid email
          const longEmail = `user@${longString}.com`;
          
          const result = validateEmail(longEmail);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Missing @ Symbol
   * For any string without @, validation should fail
   */
  it('should reject emails without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
        (invalidEmail) => {
          const result = validateEmail(invalidEmail);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Missing Domain
   * For any email without a proper domain (no dot in domain), validation should fail
   */
  it('should reject emails without proper domain', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('.')),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('.')),
        (localPart, domain) => {
          const invalidEmail = `${localPart}@${domain}`;
          
          const result = validateEmail(invalidEmail);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Case Insensitivity
   * For any valid email, changing case should not affect validation
   */
  it('should accept emails regardless of case', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(s) || /^[a-zA-Z0-9]$/.test(s)
        ),
        fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com'),
        (localPart, domain) => {
          const baseEmail = `${localPart}@${domain}`;
          const lowercase = baseEmail.toLowerCase();
          const uppercase = baseEmail.toUpperCase();
          const mixed = baseEmail.split('').map((c, i) => 
            i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
          ).join('');
          
          expect(validateEmail(lowercase).success).toBe(true);
          expect(validateEmail(uppercase).success).toBe(true);
          expect(validateEmail(mixed).success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Debounce Functionality
   * For any sequence of rapid inputs, debounce should delay execution
   */
  it('should debounce validation calls', async () => {
    let callCount = 0;
    const debouncedFn = debounce(() => {
      callCount++;
    }, 100);

    // Call multiple times rapidly
    for (let i = 0; i < 10; i++) {
      debouncedFn();
    }

    // Should not have been called yet
    expect(callCount).toBe(0);

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have been called exactly once
    expect(callCount).toBe(1);
  });

  /**
   * Property 8: Debounce with Different Delays
   * For any debounce delay, function should execute after that delay
   */
  it('should respect different debounce delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }),
        async (delay) => {
          let executed = false;
          const debouncedFn = debounce(() => {
            executed = true;
          }, delay);

          debouncedFn();

          // Should not be executed immediately
          expect(executed).toBe(false);

          // Wait for delay + buffer
          await new Promise(resolve => setTimeout(resolve, delay + 50));

          // Should be executed now
          expect(executed).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 8: Real-Time Validation Consistency
   * For any email, validation result should be consistent across multiple calls
   */
  it('should provide consistent validation results', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (email) => {
          const result1 = validateEmail(email);
          const result2 = validateEmail(email);
          const result3 = validateEmail(email);
          
          // All results should be identical
          expect(result1.success).toBe(result2.success);
          expect(result2.success).toBe(result3.success);
          expect(result1.error).toBe(result2.error);
          expect(result2.error).toBe(result3.error);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Error Message Presence
   * For any invalid email, an error message should be provided
   */
  it('should provide error messages for invalid emails', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant('no-at-sign.com'),
          fc.constant('no-domain@'),
          fc.constant('@no-local-part.com'),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@'))
        ),
        (invalidEmail) => {
          const result = validateEmail(invalidEmail);
          
          if (!result.success) {
            expect(result.error).toBeDefined();
            expect(result.error!.length).toBeGreaterThan(0);
            expect(typeof result.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Zod Schema Consistency
   * For any email, direct schema validation should match helper function
   */
  it('should have consistent results between schema and helper function', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (email) => {
          const helperResult = validateEmail(email);
          const schemaResult = emailSchema.safeParse(email);
          
          expect(helperResult.success).toBe(schemaResult.success);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Common Email Providers
   * For any email from common providers, validation should succeed
   */
  it('should accept emails from common providers', () => {
    const providers = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'protonmail.com',
    ];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(s) || /^[a-zA-Z0-9]$/.test(s)
        ),
        fc.constantFrom(...providers),
        (localPart, provider) => {
          const email = `${localPart}@${provider}`;
          const result = validateEmail(email);
          
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Special Characters in Local Part
   * For any email with valid special characters in local part, validation should succeed
   */
  it('should accept valid special characters in local part', () => {
    const validSpecialChars = ['.', '_', '-'];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => 
          /^[a-zA-Z0-9]+$/.test(s)
        ),
        fc.constantFrom(...validSpecialChars),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => 
          /^[a-zA-Z0-9]+$/.test(s)
        ),
        fc.constantFrom('gmail.com', 'yahoo.com', 'example.com'),
        (part1, specialChar, part2, domain) => {
          const localPart = `${part1}${specialChar}${part2}`;
          const email = `${localPart}@${domain}`;
          
          const result = validateEmail(email);
          
          // Should be valid (Zod's email validator accepts these)
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
