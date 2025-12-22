import { describe, it, expect } from 'vitest';
import {
  validateSearchInput,
  validateEmail,
  validateRequiredText,
  validateNumber,
  validateUrl,
  sanitizeSearchInput,
} from '@/lib/validation/input-validation';

/**
 * Input Validation Tests
 * 
 * Tests for input validation functions used in dashboard views.
 */

describe('validateSearchInput', () => {
  it('accepts empty input', () => {
    const result = validateSearchInput('');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts valid search query', () => {
    const result = validateSearchInput('john doe');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts search with numbers and special characters', () => {
    const result = validateSearchInput('user@123 #vip');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects input longer than 100 characters', () => {
    const longInput = 'a'.repeat(101);
    const result = validateSearchInput(longInput);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Search query too long (maximum 100 characters)');
  });

  it('accepts input exactly 100 characters', () => {
    const input = 'a'.repeat(100);
    const result = validateSearchInput(input);
    expect(result.valid).toBe(true);
  });

  it('rejects input with < character', () => {
    const result = validateSearchInput('test < value');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid characters in search query');
  });

  it('rejects input with > character', () => {
    const result = validateSearchInput('test > value');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid characters in search query');
  });

  it('rejects input with HTML tags', () => {
    const result = validateSearchInput('<script>alert("xss")</script>');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid characters in search query');
  });

  it('rejects input with javascript: protocol', () => {
    const result = validateSearchInput('javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid content in search query');
  });

  it('rejects input with onclick event handler', () => {
    const result = validateSearchInput('test onclick=alert(1)');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid content in search query');
  });

  it('rejects input with data:text/html', () => {
    const result = validateSearchInput('data:text/html,<script>alert(1)</script>');
    expect(result.valid).toBe(false);
    // Note: This will be caught by the < character check first
    expect(result.error).toBe('Invalid characters in search query');
  });
});

describe('validateEmail', () => {
  it('accepts valid email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts email with subdomain', () => {
    const result = validateEmail('user@mail.example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts email with plus sign', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.valid).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('rejects email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('rejects email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('rejects email without TLD', () => {
    const result = validateEmail('user@example');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });
});

describe('validateRequiredText', () => {
  it('accepts valid text', () => {
    const result = validateRequiredText('Hello world', 'Message');
    expect(result.valid).toBe(true);
  });

  it('rejects empty text', () => {
    const result = validateRequiredText('', 'Message');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required');
  });

  it('rejects whitespace-only text', () => {
    const result = validateRequiredText('   ', 'Message');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required');
  });

  it('rejects text shorter than minLength', () => {
    const result = validateRequiredText('Hi', 'Message', 5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message must be at least 5 characters');
  });

  it('rejects text longer than maxLength', () => {
    const result = validateRequiredText('Hello world', 'Message', 1, 5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message must be less than 5 characters');
  });

  it('accepts text at minLength boundary', () => {
    const result = validateRequiredText('Hello', 'Message', 5);
    expect(result.valid).toBe(true);
  });

  it('accepts text at maxLength boundary', () => {
    const result = validateRequiredText('Hello', 'Message', 1, 5);
    expect(result.valid).toBe(true);
  });
});

describe('validateNumber', () => {
  it('accepts valid number', () => {
    const result = validateNumber(42, 'Age');
    expect(result.valid).toBe(true);
  });

  it('accepts valid number string', () => {
    const result = validateNumber('42', 'Age');
    expect(result.valid).toBe(true);
  });

  it('accepts decimal number', () => {
    const result = validateNumber(3.14, 'Price');
    expect(result.valid).toBe(true);
  });

  it('rejects non-numeric string', () => {
    const result = validateNumber('abc', 'Age');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Age must be a valid number');
  });

  it('rejects number below minimum', () => {
    const result = validateNumber(5, 'Age', 10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Age must be at least 10');
  });

  it('rejects number above maximum', () => {
    const result = validateNumber(150, 'Age', 0, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Age must be at most 100');
  });

  it('accepts number at minimum boundary', () => {
    const result = validateNumber(10, 'Age', 10);
    expect(result.valid).toBe(true);
  });

  it('accepts number at maximum boundary', () => {
    const result = validateNumber(100, 'Age', 0, 100);
    expect(result.valid).toBe(true);
  });
});

describe('validateUrl', () => {
  it('accepts valid HTTP URL', () => {
    const result = validateUrl('http://example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts valid HTTPS URL', () => {
    const result = validateUrl('https://example.com');
    expect(result.valid).toBe(true);
  });

  it('accepts URL with path', () => {
    const result = validateUrl('https://example.com/path/to/page');
    expect(result.valid).toBe(true);
  });

  it('accepts URL with query parameters', () => {
    const result = validateUrl('https://example.com?param=value');
    expect(result.valid).toBe(true);
  });

  it('rejects empty URL', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('rejects invalid URL format', () => {
    const result = validateUrl('not a url');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid URL format');
  });

  it('rejects URL without protocol', () => {
    const result = validateUrl('example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid URL format');
  });
});

describe('sanitizeSearchInput', () => {
  it('returns empty string for empty input', () => {
    const result = sanitizeSearchInput('');
    expect(result).toBe('');
  });

  it('removes < and > characters', () => {
    const result = sanitizeSearchInput('test < value > here');
    expect(result).toBe('test  value  here');
  });

  it('removes javascript: protocol', () => {
    const result = sanitizeSearchInput('javascript:alert(1)');
    expect(result).toBe('alert(1)');
  });

  it('removes event handlers', () => {
    const result = sanitizeSearchInput('test onclick=alert(1)');
    expect(result).toBe('test alert(1)');
  });

  it('trims whitespace', () => {
    const result = sanitizeSearchInput('  test  ');
    expect(result).toBe('test');
  });

  it('enforces max length of 100 characters', () => {
    const longInput = 'a'.repeat(150);
    const result = sanitizeSearchInput(longInput);
    expect(result.length).toBe(100);
  });

  it('preserves valid characters', () => {
    const result = sanitizeSearchInput('john doe @123 #vip');
    expect(result).toBe('john doe @123 #vip');
  });

  it('handles multiple dangerous patterns', () => {
    const result = sanitizeSearchInput('<script>javascript:alert(1)</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('javascript:');
  });
});

describe('Validation Edge Cases', () => {
  it('handles null and undefined gracefully', () => {
    expect(validateSearchInput(null as any).valid).toBe(true);
    expect(validateSearchInput(undefined as any).valid).toBe(true);
  });

  it('handles very long input efficiently', () => {
    const veryLongInput = 'a'.repeat(10000);
    const result = validateSearchInput(veryLongInput);
    expect(result.valid).toBe(false);
  });

  it('handles unicode characters', () => {
    const result = validateSearchInput('测试 тест 🎉');
    expect(result.valid).toBe(true);
  });

  it('handles mixed case XSS attempts', () => {
    const result = validateSearchInput('JaVaScRiPt:alert(1)');
    expect(result.valid).toBe(false);
  });
});
