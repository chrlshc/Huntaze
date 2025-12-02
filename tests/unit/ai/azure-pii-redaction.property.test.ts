/**
 * Property-Based Tests for Azure PII Redaction Service
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 36.1: Write property test for PII redaction
 * **Property 32: PII redaction in logs**
 * **Validates: Requirements 9.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzurePIIRedactionService,
  PIIType,
} from '../../../lib/ai/azure/azure-pii-redaction.service';

// Custom email generator that produces valid emails matching our regex
const validEmailArb = fc.tuple(
  fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
  fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
  fc.constantFrom('com', 'org', 'net', 'io', 'co')
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

describe('AzurePIIRedactionService - Property Tests', () => {
  let service: AzurePIIRedactionService;

  beforeEach(() => {
    AzurePIIRedactionService.resetInstance();
    service = new AzurePIIRedactionService({ enabled: true });
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 32: PII redaction in logs**
   * **Validates: Requirements 9.4**
   * 
   * Property: For any string containing a valid email address,
   * the redacted output should not contain the original email
   */
  describe('Property 32: PII redaction in logs', () => {
    it('should redact all email addresses from any input', () => {
      const contextArb = fc.string({ minLength: 0, maxLength: 50 }).filter(s => !s.includes('@'));

      fc.assert(
        fc.property(validEmailArb, contextArb, contextArb, (email, prefix, suffix) => {
          const input = `${prefix} ${email} ${suffix}`;
          const result = service.redact(input);

          // The redacted output should not contain the original email
          expect(result.redacted).not.toContain(email);
          // Should contain the redaction marker
          expect(result.redacted).toContain('[EMAIL_REDACTED]');
          // Should be marked as containing PII
          expect(result.containsPII).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should redact all phone numbers from any input', () => {
      // Generate US phone numbers
      const phoneArb = fc.tuple(
        fc.integer({ min: 200, max: 999 }),
        fc.integer({ min: 200, max: 999 }),
        fc.integer({ min: 1000, max: 9999 })
      ).map(([area, exchange, subscriber]) => `${area}-${exchange}-${subscriber}`);

      const contextArb = fc.string({ minLength: 0, maxLength: 50 });

      fc.assert(
        fc.property(phoneArb, contextArb, (phone, context) => {
          const input = `Call ${phone} ${context}`;
          const result = service.redact(input);

          // The redacted output should not contain the original phone
          expect(result.redacted).not.toContain(phone);
          // Should contain the redaction marker
          expect(result.redacted).toContain('[PHONE_REDACTED]');
        }),
        { numRuns: 100 }
      );
    });

    it('should redact all SSNs from any input', () => {
      // Generate SSN-like numbers
      const ssnArb = fc.tuple(
        fc.integer({ min: 100, max: 999 }),
        fc.integer({ min: 10, max: 99 }),
        fc.integer({ min: 1000, max: 9999 })
      ).map(([a, b, c]) => `${a}-${b}-${c}`);

      fc.assert(
        fc.property(ssnArb, fc.string({ maxLength: 50 }), (ssn, context) => {
          const input = `SSN: ${ssn} ${context}`;
          const result = service.redact(input);

          expect(result.redacted).not.toContain(ssn);
          expect(result.redacted).toContain('[SSN_REDACTED]');
        }),
        { numRuns: 100 }
      );
    });

    it('should redact all IPv4 addresses from any input', () => {
      const ipArb = fc.tuple(
        fc.integer({ min: 1, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 1, max: 254 })
      ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

      fc.assert(
        fc.property(ipArb, fc.string({ maxLength: 50 }), (ip, context) => {
          const input = `IP: ${ip} ${context}`;
          const result = service.redact(input);

          expect(result.redacted).not.toContain(ip);
          expect(result.redacted).toContain('[IP_REDACTED]');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Redaction should be idempotent
   * Applying redaction twice should produce the same result
   */
  describe('Idempotence Property', () => {
    it('redacting twice should produce the same result', () => {
      const inputArb = fc.oneof(
        fc.emailAddress().map(e => `Email: ${e}`),
        fc.tuple(
          fc.integer({ min: 200, max: 999 }),
          fc.integer({ min: 200, max: 999 }),
          fc.integer({ min: 1000, max: 9999 })
        ).map(([a, b, c]) => `Phone: ${a}-${b}-${c}`),
        fc.string({ minLength: 1, maxLength: 100 })
      );

      fc.assert(
        fc.property(inputArb, (input) => {
          const firstRedaction = service.redact(input);
          const secondRedaction = service.redact(firstRedaction.redacted);

          // Second redaction should not change anything
          expect(secondRedaction.redacted).toBe(firstRedaction.redacted);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Redaction should preserve non-PII content
   */
  describe('Content Preservation Property', () => {
    it('should preserve non-PII text around redacted content', () => {
      const wordArb = fc.stringMatching(/^[a-z]{3,10}$/);

      fc.assert(
        fc.property(wordArb, validEmailArb, wordArb, (prefix, email, suffix) => {
          const input = `${prefix} ${email} ${suffix}`;
          const result = service.redact(input);

          // Prefix and suffix should be preserved
          expect(result.redacted).toContain(prefix);
          expect(result.redacted).toContain(suffix);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Multiple PII items should all be redacted
   */
  describe('Multiple PII Redaction Property', () => {
    it('should redact all PII items when multiple are present', () => {
      const phoneArb = fc.tuple(
        fc.integer({ min: 200, max: 999 }),
        fc.integer({ min: 200, max: 999 }),
        fc.integer({ min: 1000, max: 9999 })
      ).map(([a, b, c]) => `${a}-${b}-${c}`);

      fc.assert(
        fc.property(validEmailArb, phoneArb, (email, phone) => {
          const input = `Contact: ${email}, Phone: ${phone}`;
          const result = service.redact(input);

          // Neither should be in the output
          expect(result.redacted).not.toContain(email);
          expect(result.redacted).not.toContain(phone);
          // Both markers should be present
          expect(result.redacted).toContain('[EMAIL_REDACTED]');
          expect(result.redacted).toContain('[PHONE_REDACTED]');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Verification should pass after redaction
   */
  describe('Verification Property', () => {
    it('verifyRedaction should return true for redacted strings', () => {
      const piiArb = fc.oneof(
        fc.emailAddress(),
        fc.tuple(
          fc.integer({ min: 200, max: 999 }),
          fc.integer({ min: 200, max: 999 }),
          fc.integer({ min: 1000, max: 9999 })
        ).map(([a, b, c]) => `${a}-${b}-${c}`)
      );

      fc.assert(
        fc.property(piiArb, (pii) => {
          const input = `Data: ${pii}`;
          const result = service.redact(input);

          // Verification should pass on redacted output
          expect(service.verifyRedaction(result.redacted)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Object redaction should handle nested structures
   */
  describe('Object Redaction Property', () => {
    it('should redact PII in nested objects', () => {
      const keyArb = fc.stringMatching(/^[a-z]{1,10}$/);

      fc.assert(
        fc.property(validEmailArb, keyArb, (email, key) => {
          const obj = {
            [key]: email,
            nested: {
              data: email,
            },
          };

          const result = service.redactObject(obj);

          // Email should be redacted at all levels
          expect(result[key]).toBe('[EMAIL_REDACTED]');
          expect(result.nested.data).toBe('[EMAIL_REDACTED]');
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Detection should be consistent with redaction
   */
  describe('Detection Consistency Property', () => {
    it('containsPII should return true iff redaction changes the string', () => {
      const inputArb = fc.oneof(
        fc.emailAddress().map(e => `Email: ${e}`),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@'))
      );

      fc.assert(
        fc.property(inputArb, (input) => {
          const containsPII = service.containsPII(input);
          const result = service.redact(input);

          // If containsPII is true, redaction should change the string
          if (containsPII) {
            expect(result.redacted).not.toBe(input);
          }
          // containsPII result should match redaction result
          expect(result.containsPII).toBe(containsPII);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Statistics should accurately count redactions
   */
  describe('Statistics Property', () => {
    it('stats should accurately reflect redaction counts', () => {
      service.resetStats();

      const countArb = fc.integer({ min: 1, max: 10 });

      fc.assert(
        fc.property(countArb, (count) => {
          service.resetStats();

          for (let i = 0; i < count; i++) {
            service.redact(`test${i}@example.com`);
          }

          const stats = service.getStats();
          expect(stats.totalProcessed).toBe(count);
          expect(stats.totalRedacted).toBe(count);
          expect(stats.byType.email).toBe(count);
        }),
        { numRuns: 20 }
      );
    });
  });
});
