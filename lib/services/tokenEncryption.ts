/**
 * Token Encryption Service
 * 
 * Provides AES-256-GCM encryption for OAuth tokens
 * Following OWASP best practices for cryptographic storage
 * 
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
 */

import crypto from 'crypto';

// Algorithm: AES-256-GCM (Galois/Counter Mode)
// - Authenticated encryption (prevents tampering)
// - 256-bit key for strong security
// - 96-bit IV (recommended for GCM)
// - 128-bit authentication tag
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * In production, this should come from KMS/Vault
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
  }

  // Key should be base64-encoded 32-byte key
  const keyBuffer = Buffer.from(key, 'base64');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (256 bits)`);
  }

  return keyBuffer;
}

/**
 * Generate a new encryption key (for setup/rotation)
 * Run this once and store in environment/KMS
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Encrypt a token using AES-256-GCM
 * 
 * @param plaintext - The token to encrypt
 * @returns Encrypted token in format: iv:authTag:ciphertext (all base64)
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  try {
    const key = getEncryptionKey();
    
    // Generate random IV (must be unique for each encryption)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
  } catch (error) {
    throw new Error(`Token encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * 
 * @param encrypted - Encrypted token in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext token
 */
export function decryptToken(encrypted: string): string {
  if (!encrypted) {
    throw new Error('Cannot decrypt empty token');
  }

  try {
    const key = getEncryptionKey();
    
    // Parse encrypted format: iv:authTag:ciphertext
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    
    // Decode from base64
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid auth tag length');
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    // Don't expose internal error details for security
    throw new Error('Token decryption failed: Invalid or corrupted token');
  }
}

/**
 * Validate that encryption/decryption is working correctly
 * Use this for health checks
 */
export function validateEncryption(): boolean {
  try {
    const testToken = 'test_token_' + Date.now();
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    return decrypted === testToken;
  } catch {
    return false;
  }
}

/**
 * Token Encryption Service
 * Main interface for token encryption operations
 */
export class TokenEncryptionService {
  /**
   * Encrypt an access token
   */
  encryptAccessToken(token: string): string {
    return encryptToken(token);
  }

  /**
   * Decrypt an access token
   */
  decryptAccessToken(encrypted: string): string {
    return decryptToken(encrypted);
  }

  /**
   * Encrypt a refresh token
   */
  encryptRefreshToken(token: string): string {
    return encryptToken(token);
  }

  /**
   * Decrypt a refresh token
   */
  decryptRefreshToken(encrypted: string): string {
    return decryptToken(encrypted);
  }

  /**
   * Validate encryption is working
   */
  validate(): boolean {
    return validateEncryption();
  }
}

// Export singleton instance
export const tokenEncryption = new TokenEncryptionService();
