/**
 * Authentication Validators - Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  sanitizeEmail,
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validateSignInCredentials,
  validateSignUpCredentials,
  isDisposableEmail,
  sanitizeInput,
  sanitizeName,
} from '@/lib/auth/validators';

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('rejects invalid format', () => {
      const result = validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects email without domain', () => {
      const result = validateEmail('user@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects email without @', () => {
      const result = validateEmail('userexample.com');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects too long email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is too long (max 254 characters)');
    });

    it('detects common typos', () => {
      const result = validateEmail('user@gmial.com');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Did you mean user@gmail.com?');
    });
  });

  describe('sanitizeEmail', () => {
    it('converts to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('trims whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('handles both trim and lowercase', () => {
      expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });
  });

  describe('isDisposableEmail', () => {
    it('detects disposable email providers', () => {
      expect(isDisposableEmail('user@tempmail.com')).toBe(true);
      expect(isDisposableEmail('user@throwaway.email')).toBe(true);
      expect(isDisposableEmail('user@10minutemail.com')).toBe(true);
    });

    it('allows legitimate email providers', () => {
      expect(isDisposableEmail('user@gmail.com')).toBe(false);
      expect(isDisposableEmail('user@yahoo.com')).toBe(false);
      expect(isDisposableEmail('user@company.com')).toBe(false);
    });
  });
});

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('MyP@ssw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('rejects too short password', () => {
      const result = validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects password without uppercase', () => {
      const result = validatePassword('myp@ssw0rd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('rejects password without lowercase', () => {
      const result = validatePassword('MYP@SSW0RD');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('rejects password without numbers', () => {
      const result = validatePassword('MyP@ssword');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('rejects password without special characters', () => {
      const result = validatePassword('MyPassw0rd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('rejects common weak passwords', () => {
      const result = validatePassword('password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('This password is too common. Please choose a stronger password');
    });

    it('rejects too long password', () => {
      const longPassword = 'A'.repeat(130) + '1!';
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is too long (max 128 characters)');
    });
  });

  describe('calculatePasswordStrength', () => {
    it('gives low score to weak password', () => {
      const score = calculatePasswordStrength('password');
      expect(score).toBeLessThan(30);
    });

    it('gives medium score to fair password', () => {
      const score = calculatePasswordStrength('Password123');
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThan(60);
    });

    it('gives high score to good password', () => {
      const score = calculatePasswordStrength('MyP@ssw0rd');
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThan(80);
    });

    it('gives very high score to strong password', () => {
      const score = calculatePasswordStrength('MyV3ry$tr0ng&C0mpl3xP@ssw0rd!');
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('penalizes repeated characters', () => {
      const score1 = calculatePasswordStrength('MyP@ssw0rd');
      const score2 = calculatePasswordStrength('MyP@sssw0rd'); // Extra 's'
      expect(score2).toBeLessThan(score1);
    });

    it('penalizes only letters', () => {
      const score = calculatePasswordStrength('OnlyLetters');
      expect(score).toBeLessThan(50);
    });

    it('penalizes only numbers', () => {
      const score = calculatePasswordStrength('12345678');
      expect(score).toBeLessThan(30);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('returns weak for low scores', () => {
      const { label, color } = getPasswordStrengthLabel(20);
      expect(label).toBe('Weak');
      expect(color).toBe('red');
    });

    it('returns fair for medium scores', () => {
      const { label, color } = getPasswordStrengthLabel(50);
      expect(label).toBe('Fair');
      expect(color).toBe('orange');
    });

    it('returns good for high scores', () => {
      const { label, color } = getPasswordStrengthLabel(70);
      expect(label).toBe('Good');
      expect(color).toBe('yellow');
    });

    it('returns strong for very high scores', () => {
      const { label, color } = getPasswordStrengthLabel(90);
      expect(label).toBe('Strong');
      expect(color).toBe('green');
    });
  });
});

describe('Credentials Validation', () => {
  describe('validateSignInCredentials', () => {
    it('validates correct credentials', () => {
      const result = validateSignInCredentials('user@example.com', 'password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid email', () => {
      const result = validateSignInCredentials('invalid-email', 'password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects empty password', () => {
      const result = validateSignInCredentials('user@example.com', '');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('rejects both invalid', () => {
      const result = validateSignInCredentials('invalid-email', '');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateSignUpCredentials', () => {
    it('validates correct sign up', () => {
      const result = validateSignUpCredentials(
        'user@example.com',
        'MyP@ssw0rd',
        'MyP@ssw0rd',
        'John Doe'
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects mismatched passwords', () => {
      const result = validateSignUpCredentials(
        'user@example.com',
        'MyP@ssw0rd',
        'DifferentP@ssw0rd'
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('rejects weak password', () => {
      const result = validateSignUpCredentials(
        'user@example.com',
        'weak',
        'weak'
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects too short name', () => {
      const result = validateSignUpCredentials(
        'user@example.com',
        'MyP@ssw0rd',
        'MyP@ssw0rd',
        'J'
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters');
    });

    it('rejects too long name', () => {
      const longName = 'A'.repeat(101);
      const result = validateSignUpCredentials(
        'user@example.com',
        'MyP@ssw0rd',
        'MyP@ssw0rd',
        longName
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is too long (max 100 characters)');
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('removes angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('removes javascript protocol', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
    });

    it('removes event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('handles clean input', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeName', () => {
    it('removes script tags', () => {
      expect(sanitizeName('<script>alert("xss")</script>John')).toBe('John');
    });

    it('allows valid characters', () => {
      expect(sanitizeName("John O'Brien-Smith Jr.")).toBe("John O'Brien-Smith Jr.");
    });

    it('removes invalid characters', () => {
      expect(sanitizeName('John@#$%Doe')).toBe('JohnDoe');
    });

    it('limits length', () => {
      const longName = 'A'.repeat(150);
      expect(sanitizeName(longName)).toHaveLength(100);
    });

    it('trims whitespace', () => {
      expect(sanitizeName('  John Doe  ')).toBe('John Doe');
    });
  });
});
