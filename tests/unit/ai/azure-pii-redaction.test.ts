/**
 * Unit Tests for Azure PII Redaction Service
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 36: Implement PII redaction for logs
 * Validates: Requirements 9.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AzurePIIRedactionService,
  redactPII,
  hasPII,
  safeLog,
} from '../../../lib/ai/azure/azure-pii-redaction.service';

describe('AzurePIIRedactionService', () => {
  let service: AzurePIIRedactionService;

  beforeEach(() => {
    AzurePIIRedactionService.resetInstance();
    service = new AzurePIIRedactionService({ enabled: true });
  });

  describe('Email Redaction', () => {
    it('should redact email addresses', () => {
      const input = 'Contact us at support@example.com for help';
      const result = service.redact(input);

      expect(result.redacted).toBe('Contact us at [EMAIL_REDACTED] for help');
      expect(result.containsPII).toBe(true);
      expect(result.redactionsApplied.length).toBeGreaterThan(0);
      expect(result.redactionsApplied[0].type).toBe('email');
    });

    it('should redact multiple email addresses', () => {
      const input = 'Send to john@test.com and jane@example.org';
      const result = service.redact(input);

      expect(result.redacted).toBe('Send to [EMAIL_REDACTED] and [EMAIL_REDACTED]');
      expect(result.redactionsApplied.length).toBe(2);
    });

    it('should handle various email formats', () => {
      const emails = [
        'simple@example.com',
        'very.common@example.com',
        'disposable.style.email.with+symbol@example.com',
        'other.email-with-hyphen@example.com',
        'user.name+tag+sorting@example.com',
      ];

      for (const email of emails) {
        const result = service.redact(`Email: ${email}`);
        expect(result.containsPII).toBe(true);
        expect(result.redacted).toContain('[EMAIL_REDACTED]');
      }
    });
  });

  describe('Phone Number Redaction', () => {
    it('should redact US phone numbers', () => {
      const formats = [
        '555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '5551234567',
        '+1 555-123-4567',
      ];

      for (const phone of formats) {
        const result = service.redact(`Call ${phone}`);
        expect(result.containsPII).toBe(true);
        expect(result.redacted).toContain('[PHONE_REDACTED]');
      }
    });

    it('should redact international phone numbers', () => {
      // Test with format that matches our international pattern
      const input = 'Call +1-555-123-4567 for support';
      const result = service.redact(input);

      expect(result.containsPII).toBe(true);
      expect(result.redacted).toContain('[PHONE_REDACTED]');
    });
  });

  describe('SSN Redaction', () => {
    it('should redact SSN formats', () => {
      const formats = [
        '123-45-6789',
        '123 45 6789',
        '123456789',
      ];

      for (const ssn of formats) {
        const result = service.redact(`SSN: ${ssn}`);
        expect(result.containsPII).toBe(true);
        expect(result.redacted).toContain('[SSN_REDACTED]');
      }
    });
  });

  describe('Credit Card Redaction', () => {
    it('should redact credit card numbers', () => {
      const cards = [
        '4111111111111111', // Visa
        '5500000000000004', // Mastercard
        '340000000000009',  // Amex
        '4111-1111-1111-1111', // Formatted
        '4111 1111 1111 1111', // Spaced
      ];

      for (const card of cards) {
        const result = service.redact(`Card: ${card}`);
        expect(result.containsPII).toBe(true);
        expect(result.redacted).toContain('[CARD_REDACTED]');
      }
    });
  });

  describe('IP Address Redaction', () => {
    it('should redact IPv4 addresses', () => {
      const input = 'Request from 192.168.1.100';
      const result = service.redact(input);

      expect(result.containsPII).toBe(true);
      expect(result.redacted).toBe('Request from [IP_REDACTED]');
    });

    it('should redact IPv6 addresses', () => {
      const input = 'IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const result = service.redact(input);

      expect(result.containsPII).toBe(true);
      expect(result.redacted).toContain('[IP_REDACTED]');
    });
  });

  describe('API Key Redaction', () => {
    it('should redact API keys', () => {
      const input = 'api_key=sk_test_dummy_key_for_unit_tests_only';
      const result = service.redact(input);

      expect(result.containsPII).toBe(true);
      expect(result.redacted).toContain('[API_KEY_REDACTED]');
    });

    it('should redact Bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = service.redact(input);

      expect(result.containsPII).toBe(true);
      expect(result.redacted).toContain('[TOKEN_REDACTED]');
    });
  });

  describe('Password Redaction', () => {
    it('should redact password fields', () => {
      const inputs = [
        'password=mysecretpassword',
        'passwd: secretpass123',
        'pwd=hunter2',
      ];

      for (const input of inputs) {
        const result = service.redact(input);
        expect(result.containsPII).toBe(true);
        expect(result.redacted).toContain('[PASSWORD_REDACTED]');
      }
    });
  });

  describe('Object Redaction', () => {
    it('should redact PII from objects', () => {
      const obj = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        nested: {
          ssn: '123-45-6789',
        },
      };

      const result = service.redactObject(obj);

      expect(result.email).toBe('[EMAIL_REDACTED]');
      expect(result.phone).toBe('[PHONE_REDACTED]');
      expect(result.nested.ssn).toBe('[SSN_REDACTED]');
    });

    it('should handle arrays in objects', () => {
      const obj = {
        emails: ['john@example.com', 'jane@example.com'],
        data: [{ phone: '555-123-4567' }],
      };

      const result = service.redactObject(obj);

      expect(result.emails[0]).toBe('[EMAIL_REDACTED]');
      expect(result.emails[1]).toBe('[EMAIL_REDACTED]');
      expect(result.data[0].phone).toBe('[PHONE_REDACTED]');
    });
  });

  describe('PII Detection', () => {
    it('should detect PII in strings', () => {
      expect(service.containsPII('john@example.com')).toBe(true);
      expect(service.containsPII('555-123-4567')).toBe(true);
      expect(service.containsPII('Hello world')).toBe(false);
    });

    it('should detect multiple PII types', () => {
      const input = 'Email: john@example.com, Phone: 555-123-4567';
      const types = service.detectPIITypes(input);

      expect(types).toContain('email');
      expect(types).toContain('phone');
    });
  });

  describe('Pattern Management', () => {
    it('should add custom patterns', () => {
      service.addPattern({
        name: 'custom_id',
        type: 'custom',
        pattern: /\bCUST-[0-9]{6}\b/g,
        replacement: '[CUSTOMER_ID_REDACTED]',
        enabled: true,
      });

      const result = service.redact('Customer ID: CUST-123456');
      expect(result.redacted).toBe('Customer ID: [CUSTOMER_ID_REDACTED]');
    });

    it('should enable/disable patterns', () => {
      service.setPatternEnabled('email', false);
      const result = service.redact('Email: john@example.com');
      expect(result.redacted).toBe('Email: john@example.com');

      service.setPatternEnabled('email', true);
      const result2 = service.redact('Email: john@example.com');
      expect(result2.redacted).toBe('Email: [EMAIL_REDACTED]');
    });

    it('should remove patterns', () => {
      const removed = service.removePattern('email');
      expect(removed).toBe(true);

      const result = service.redact('Email: john@example.com');
      expect(result.redacted).toBe('Email: john@example.com');
    });
  });

  describe('Configuration', () => {
    it('should respect enabled flag', () => {
      service.updateConfig({ enabled: false });
      const result = service.redact('Email: john@example.com');
      expect(result.redacted).toBe('Email: john@example.com');
    });

    it('should track statistics', () => {
      service.redact('Email: john@example.com');
      service.redact('Phone: 555-123-4567');
      service.redact('No PII here');

      const stats = service.getStats();
      expect(stats.totalProcessed).toBe(3);
      expect(stats.totalRedacted).toBe(2);
      expect(stats.byType.email).toBeGreaterThan(0);
      expect(stats.byType.phone).toBeGreaterThan(0);
    });
  });

  describe('Verification', () => {
    it('should verify redaction completeness', () => {
      const result = service.redact('Email: john@example.com');
      expect(service.verifyRedaction(result.redacted)).toBe(true);
    });

    it('should detect incomplete redaction', () => {
      expect(service.verifyRedaction('Email: john@example.com')).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('redactPII should work', () => {
      const result = redactPII('Email: john@example.com');
      expect(result).toBe('Email: [EMAIL_REDACTED]');
    });

    it('hasPII should work', () => {
      expect(hasPII('john@example.com')).toBe(true);
      expect(hasPII('Hello world')).toBe(false);
    });

    it('safeLog should work', () => {
      const result = safeLog('User john@example.com logged in', {
        ip: '192.168.1.100',
      });

      expect(result.message).toBe('User [EMAIL_REDACTED] logged in');
      expect(result.data?.ip).toBe('[IP_REDACTED]');
    });
  });
});
