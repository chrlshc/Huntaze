/**
 * Property-Based Tests for Password Strength
 * 
 * Feature: signup-ux-optimization, Property 9: Password Strength Indication
 * For any password input, the system should calculate and display strength in real-time
 * Validates: Requirements 4.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculatePasswordStrength,
  validatePassword,
  PasswordStrength,
  passwordSchema,
} from '../../../lib/validation/signup';

describe('Password Strength Property Tests', () => {
  /**
   * Property 9: Score Range
   * For any password, strength score should be between 0 and 100
   */
  it('should always return score between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const result = calculatePasswordStrength(password);
          
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Strength Level Consistency
   * For any password, strength level should match score ranges
   */
  it('should assign correct strength level based on score', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const result = calculatePasswordStrength(password);
          
          if (result.score <= 25) {
            expect(result.strength).toBe(PasswordStrength.WEAK);
          } else if (result.score <= 50) {
            expect(result.strength).toBe(PasswordStrength.FAIR);
          } else if (result.score <= 75) {
            expect(result.strength).toBe(PasswordStrength.GOOD);
          } else {
            expect(result.strength).toBe(PasswordStrength.STRONG);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Longer Passwords Have Higher Scores
   * For any password, adding characters should not decrease score
   */
  it('should not decrease score when adding characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (basePassword, addition) => {
          const shortResult = calculatePasswordStrength(basePassword);
          const longResult = calculatePasswordStrength(basePassword + addition);
          
          // Longer password should have equal or higher score
          expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Feedback Presence
   * For any password, feedback array should be defined
   */
  it('should always provide feedback array', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const result = calculatePasswordStrength(password);
          
          expect(Array.isArray(result.feedback)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Weak Passwords Have Feedback
   * For any weak password (score <= 25), feedback should suggest improvements
   */
  it('should provide improvement feedback for weak passwords', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }), // Short passwords are typically weak
        (password) => {
          const result = calculatePasswordStrength(password);
          
          if (result.strength === PasswordStrength.WEAK) {
            expect(result.feedback.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Strong Passwords Meet Requirements
   * For any password with score >= 76, it should meet minimum requirements
   */
  it('should meet requirements for strong passwords', () => {
    fc.assert(
      fc.property(
        // Generate passwords that should be strong
        fc.string({ minLength: 12, maxLength: 20 })
          .map(s => s + 'Aa1!'), // Add required character types
        (password) => {
          const result = calculatePasswordStrength(password);
          
          if (result.score >= 76) {
            // Strong passwords should meet requirements
            const validation = passwordSchema.safeParse(password);
            expect(validation.success || result.meetsRequirements).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Character Variety Increases Score
   * For any password, adding different character types should increase score
   */
  it('should increase score with character variety', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 8 }).filter(s => /^[a-z]+$/.test(s)),
        (basePassword) => {
          const onlyLowercase = calculatePasswordStrength(basePassword);
          const withUppercase = calculatePasswordStrength(basePassword + 'A');
          const withNumber = calculatePasswordStrength(basePassword + 'A1');
          const withSpecial = calculatePasswordStrength(basePassword + 'A1!');
          
          // Each addition should increase or maintain score
          expect(withUppercase.score).toBeGreaterThanOrEqual(onlyLowercase.score);
          expect(withNumber.score).toBeGreaterThanOrEqual(withUppercase.score);
          expect(withSpecial.score).toBeGreaterThanOrEqual(withNumber.score);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Minimum Requirements Check
   * For any password, meetsRequirements should match schema validation
   */
  it('should correctly identify if password meets requirements', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const result = calculatePasswordStrength(password);
          const schemaResult = passwordSchema.safeParse(password);
          
          expect(result.meetsRequirements).toBe(schemaResult.success);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Empty Password is Weak
   * For any empty string, strength should be weak
   */
  it('should classify empty password as weak', () => {
    const result = calculatePasswordStrength('');
    
    expect(result.strength).toBe(PasswordStrength.WEAK);
    expect(result.score).toBe(0);
    expect(result.meetsRequirements).toBe(false);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  /**
   * Property 9: Validation Helper Consistency
   * For any password, validatePassword should return consistent strength
   */
  it('should have consistent results between validation and strength calculation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const validationResult = validatePassword(password);
          const strengthResult = calculatePasswordStrength(password);
          
          if (validationResult.strength) {
            expect(validationResult.strength.score).toBe(strengthResult.score);
            expect(validationResult.strength.strength).toBe(strengthResult.strength);
            expect(validationResult.strength.meetsRequirements).toBe(strengthResult.meetsRequirements);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Feedback Specificity
   * For any password missing character types, feedback should mention them
   */
  it('should provide specific feedback for missing character types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 12 }).filter(s => /^[a-z]+$/.test(s)),
        (password) => {
          const result = calculatePasswordStrength(password);
          
          // Should mention missing uppercase
          const hasUppercaseFeedback = result.feedback.some(f => 
            f.toLowerCase().includes('uppercase')
          );
          expect(hasUppercaseFeedback).toBe(true);
          
          // Should mention missing numbers
          const hasNumberFeedback = result.feedback.some(f => 
            f.toLowerCase().includes('number')
          );
          expect(hasNumberFeedback).toBe(true);
          
          // Should mention missing special characters
          const hasSpecialFeedback = result.feedback.some(f => 
            f.toLowerCase().includes('special')
          );
          expect(hasSpecialFeedback).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Score Determinism
   * For any password, calculating strength multiple times should give same result
   */
  it('should return consistent results for same password', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 128 }),
        (password) => {
          const result1 = calculatePasswordStrength(password);
          const result2 = calculatePasswordStrength(password);
          const result3 = calculatePasswordStrength(password);
          
          expect(result1.score).toBe(result2.score);
          expect(result2.score).toBe(result3.score);
          expect(result1.strength).toBe(result2.strength);
          expect(result2.strength).toBe(result3.strength);
          expect(result1.meetsRequirements).toBe(result2.meetsRequirements);
          expect(result2.meetsRequirements).toBe(result3.meetsRequirements);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Common Weak Passwords
   * For any common weak password pattern, strength should be weak or fair
   */
  it('should identify common weak password patterns', () => {
    const weakPatterns = [
      'password',
      '12345678',
      'qwerty',
      'abc123',
      'letmein',
      'welcome',
    ];

    weakPatterns.forEach(password => {
      const result = calculatePasswordStrength(password);
      
      expect(result.strength).toMatch(/weak|fair/i);
      expect(result.score).toBeLessThanOrEqual(50);
    });
  });

  /**
   * Property 9: Strong Password Examples
   * For any password meeting all requirements with good length, strength should be good or strong
   */
  it('should identify strong passwords correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 20 }),
        (length) => {
          // Generate a strong password
          const password = 'Aa1!' + 'x'.repeat(length - 4);
          const result = calculatePasswordStrength(password);
          
          expect(result.meetsRequirements).toBe(true);
          expect(result.strength).toMatch(/good|strong/i);
          expect(result.score).toBeGreaterThan(50);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Unique Characters Bonus
   * For any password, using more unique characters should increase score
   */
  it('should reward unique character usage', () => {
    const repeated = 'aaaaaaaaA1!';
    const unique = 'abcdefghA1!';
    
    const repeatedResult = calculatePasswordStrength(repeated);
    const uniqueResult = calculatePasswordStrength(unique);
    
    // Unique characters should score higher
    expect(uniqueResult.score).toBeGreaterThan(repeatedResult.score);
  });

  /**
   * Property 9: Length Feedback
   * For any password shorter than 8 characters, feedback should mention length
   */
  it('should provide length feedback for short passwords', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (password) => {
          const result = calculatePasswordStrength(password);
          
          const hasLengthFeedback = result.feedback.some(f => 
            f.toLowerCase().includes('character') || f.toLowerCase().includes('length')
          );
          expect(hasLengthFeedback).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 9: Validation Error Messages
   * For any invalid password, validatePassword should provide error message
   */
  it('should provide error messages for invalid passwords', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 7 }), // Too short
          fc.string({ minLength: 8, maxLength: 12 }).filter(s => !/[A-Z]/.test(s)), // No uppercase
          fc.string({ minLength: 8, maxLength: 12 }).filter(s => !/[0-9]/.test(s)), // No numbers
        ),
        (password) => {
          const result = validatePassword(password);
          
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
});
