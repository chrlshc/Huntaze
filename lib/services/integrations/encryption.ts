/**
 * Token Encryption/Decryption Utilities
 * 
 * Provides secure encryption for OAuth tokens using AES-256-GCM
 * Requirements: 11.1, 11.2, 11.4
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY || process.env.DATA_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY or DATA_ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is base64 encoded, decode it
  if (key.length === 44 && key.endsWith('=')) {
    return Buffer.from(key, 'base64');
  }
  
  // Otherwise, hash it to get 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a token for secure storage
 * 
 * @param token - The token to encrypt
 * @returns Encrypted token in format: iv:authTag:encrypted
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token is required for encryption');
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token from storage
 * 
 * @param encryptedToken - The encrypted token in format: iv:authTag:encrypted
 * @returns Decrypted token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Encrypted token is required for decryption');
  }
  
  const key = getEncryptionKey();
  
  // Parse the encrypted data
  const parts = encryptedToken.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  // Validate lengths
  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }
  
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }
  
  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a token is encrypted (has the expected format)
 */
export function isEncrypted(token: string): boolean {
  if (!token) return false;
  
  const parts = token.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}

/**
 * Safely encrypt a token (returns original if already encrypted)
 */
export function safeEncrypt(token: string): string {
  if (!token) return token;
  if (isEncrypted(token)) return token;
  return encryptToken(token);
}

/**
 * Safely decrypt a token (returns original if not encrypted)
 */
export function safeDecrypt(token: string): string {
  if (!token) return token;
  if (!isEncrypted(token)) return token;
  return decryptToken(token);
}
