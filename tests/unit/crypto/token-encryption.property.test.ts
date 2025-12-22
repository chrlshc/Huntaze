/**
 * Property-Based Tests for Token Encryption
 *
 * **Feature: content-posting-system, Property 4: Token Encryption**
 * **Validates: Requirements 2.4**
 *
 * This test verifies that token encryption/decryption is correct and secure.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  encryptToken,
  decryptToken,
  isEncryptedToken,
  generateEncryptionKey,
  safeEncryptToken,
  safeDecryptToken,
} from "../../../lib/crypto/token-encryption";

// Set up test encryption key
const TEST_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Token Encryption - Property-Based Tests", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /**
   * Property 4: Token Encryption Round Trip
   *
   * For any token, encrypt → decrypt should return the original token
   */
  it("should return original token after encrypt → decrypt for any token", async () => {
    await fc.assert(
      fc.property(
        // Generate random tokens (non-empty strings)
        fc.string({ minLength: 1, maxLength: 1000 }),
        (token) => {
          const encrypted = encryptToken(token);
          const decrypted = decryptToken(encrypted);

          // Property: decrypt(encrypt(token)) === token
          expect(decrypted).toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Encrypted token is different from original
   *
   * For any token, the encrypted version should be different from the original
   */
  it("should produce encrypted token different from original", async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        (token) => {
          const encrypted = encryptToken(token);

          // Property: encrypted !== token
          expect(encrypted).not.toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each encryption produces unique ciphertext (due to random IV)
   *
   * Encrypting the same token twice should produce different ciphertexts
   */
  it("should produce different ciphertext for same token (random IV)", async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (token) => {
          const encrypted1 = encryptToken(token);
          const encrypted2 = encryptToken(token);

          // Property: two encryptions of same token are different
          expect(encrypted1).not.toBe(encrypted2);

          // But both decrypt to the same original
          expect(decryptToken(encrypted1)).toBe(token);
          expect(decryptToken(encrypted2)).toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Encrypted token is valid base64
   *
   * The encrypted output should be valid base64
   */
  it("should produce valid base64 output", async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (token) => {
          const encrypted = encryptToken(token);

          // Property: encrypted is valid base64
          const decoded = Buffer.from(encrypted, "base64");
          const reEncoded = decoded.toString("base64");
          expect(reEncoded).toBe(encrypted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isEncryptedToken correctly identifies encrypted tokens
   */
  it("should correctly identify encrypted tokens", async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (token) => {
          const encrypted = encryptToken(token);

          // Property: encrypted tokens are identified as such
          expect(isEncryptedToken(encrypted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Plain tokens are not identified as encrypted
   */
  it("should not identify plain tokens as encrypted", async () => {
    await fc.assert(
      fc.property(
        // Generate strings that are NOT valid base64 of sufficient length
        fc.string({ minLength: 1, maxLength: 40 }),
        (token) => {
          // Short strings should not be identified as encrypted
          expect(isEncryptedToken(token)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Handles Unicode and special characters
   */
  it("should handle Unicode and special characters", async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).map((s) => s + "🔐✨émoji"),
        (token) => {
          const encrypted = encryptToken(token);
          const decrypted = decryptToken(encrypted);

          expect(decrypted).toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Handles realistic OAuth tokens
   */
  it("should handle realistic OAuth token formats", async () => {
    await fc.assert(
      fc.property(
        // Generate tokens that look like OAuth tokens
        fc.record({
          prefix: fc.constantFrom("ya29.", "EAA", "IGQ", ""),
          body: fc
            .array(fc.constantFrom(..."0123456789abcdef".split("")), {
              minLength: 50,
              maxLength: 200,
            })
            .map((arr) => arr.join("")),
          suffix: fc.constantFrom("", "-1234567890"),
        }),
        ({ prefix, body, suffix }) => {
          const token = prefix + body + suffix;
          const encrypted = encryptToken(token);
          const decrypted = decryptToken(encrypted);

          expect(decrypted).toBe(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test: Empty token throws error
   */
  it("should throw error for empty token", () => {
    expect(() => encryptToken("")).toThrow("Token cannot be empty");
  });

  /**
   * Test: Empty encrypted token throws error
   */
  it("should throw error for empty encrypted token", () => {
    expect(() => decryptToken("")).toThrow("Encrypted token cannot be empty");
  });

  /**
   * Test: Invalid encrypted token throws error
   */
  it("should throw error for invalid encrypted token", () => {
    expect(() => decryptToken("invalid-base64!@#")).toThrow();
  });

  /**
   * Test: Too short encrypted token throws error
   */
  it("should throw error for too short encrypted token", () => {
    const shortBase64 = Buffer.from("short").toString("base64");
    expect(() => decryptToken(shortBase64)).toThrow("too short");
  });

  /**
   * Test: Tampered ciphertext throws authentication error
   */
  it("should throw error for tampered ciphertext", () => {
    const token = "test-token";
    const encrypted = encryptToken(token);

    // Tamper with the ciphertext (change a character in the middle)
    const tampered =
      encrypted.substring(0, 50) +
      (encrypted[50] === "A" ? "B" : "A") +
      encrypted.substring(51);

    expect(() => decryptToken(tampered)).toThrow("authentication failed");
  });

  /**
   * Test: generateEncryptionKey produces valid key
   */
  it("should generate valid 256-bit encryption key", () => {
    const key = generateEncryptionKey();

    // Should be 64 hex characters (32 bytes = 256 bits)
    expect(key).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);

    // Each generated key should be unique
    const key2 = generateEncryptionKey();
    expect(key).not.toBe(key2);
  });

  /**
   * Test: safeEncryptToken handles null/undefined
   */
  it("should return null for null/undefined tokens", () => {
    expect(safeEncryptToken(null)).toBeNull();
    expect(safeEncryptToken(undefined)).toBeNull();
  });

  /**
   * Test: safeDecryptToken handles null/undefined
   */
  it("should return null for null/undefined encrypted tokens", () => {
    expect(safeDecryptToken(null)).toBeNull();
    expect(safeDecryptToken(undefined)).toBeNull();
  });

  /**
   * Test: safeDecryptToken handles invalid tokens gracefully
   */
  it("should return null for invalid encrypted tokens", () => {
    expect(safeDecryptToken("invalid")).toBeNull();
  });

  /**
   * Test: Missing ENCRYPTION_KEY throws error
   */
  it("should throw error when ENCRYPTION_KEY is not set", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");

    expect(() => encryptToken("test")).toThrow("ENCRYPTION_KEY");
  });

  /**
   * Test: Different keys produce different ciphertexts
   */
  it("should produce different ciphertext with different keys", () => {
    const token = "test-token";

    // Encrypt with first key
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
    const encrypted1 = encryptToken(token);

    // Encrypt with different key
    const differentKey =
      "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
    vi.stubEnv("ENCRYPTION_KEY", differentKey);
    const encrypted2 = encryptToken(token);

    // Ciphertexts should be different
    expect(encrypted1).not.toBe(encrypted2);

    // Decrypting with wrong key should fail
    vi.stubEnv("ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
    expect(() => decryptToken(encrypted2)).toThrow();
  });
});
