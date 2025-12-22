/**
 * Token Encryption Module
 *
 * Provides AES-256-GCM encryption for OAuth tokens stored in the database.
 * Uses ENCRYPTION_KEY from environment (AWS Secrets Manager in production).
 *
 * Requirements: 2.4
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Please configure it in AWS Secrets Manager or .env file."
    );
  }

  // If key is hex-encoded (64 chars = 32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }

  // If key is base64-encoded
  if (key.length === 44 && key.endsWith("=")) {
    const decoded = Buffer.from(key, "base64");
    if (decoded.length === KEY_LENGTH) {
      return decoded;
    }
  }

  // If key is raw string, hash it to get consistent 32 bytes
  // This is less secure than using a proper key, but provides fallback
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * Output format: base64(iv + authTag + ciphertext)
 *
 * @param token - Plain text token to encrypt
 * @returns Encrypted token as base64 string
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error("Token cannot be empty");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (16 bytes) + AuthTag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypt a token using AES-256-GCM
 *
 * Input format: base64(iv + authTag + ciphertext)
 *
 * @param encryptedToken - Encrypted token as base64 string
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error("Encrypted token cannot be empty");
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedToken, "base64");

  // Validate minimum length: IV (16) + AuthTag (16) + at least 1 byte ciphertext
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted token format: too short");
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // Authentication failed - token was tampered with or wrong key
    throw new Error(
      "Failed to decrypt token: authentication failed. " +
        "Token may be corrupted or encrypted with a different key."
    );
  }
}

/**
 * Check if a string appears to be an encrypted token
 * (base64 encoded with minimum expected length)
 */
export function isEncryptedToken(value: string): boolean {
  // Minimum: base64(16 IV + 16 authTag + 1 byte ciphertext) = base64(33 bytes) = 44 chars
  if (!value || value.length < 44) {
    return false;
  }

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(value, "base64");
    // Re-encode and compare to validate base64
    return decoded.toString("base64") === value;
  } catch {
    return false;
  }
}

/**
 * Safely encrypt a token, returning null if encryption fails
 */
export function safeEncryptToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  try {
    return encryptToken(token);
  } catch (error) {
    console.error("Failed to encrypt token:", error);
    return null;
  }
}

/**
 * Safely decrypt a token, returning null if decryption fails
 */
export function safeDecryptToken(encryptedToken: string | null | undefined): string | null {
  if (!encryptedToken) {
    return null;
  }

  try {
    return decryptToken(encryptedToken);
  } catch (error) {
    console.error("Failed to decrypt token:", error);
    return null;
  }
}

/**
 * Generate a new random encryption key (for initial setup)
 * Returns hex-encoded 256-bit key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
