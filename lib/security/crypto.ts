/**
 * Encryption utilities for sensitive data (AES-256-CBC)
 * 
 * Used to encrypt OnlyFans cookies and other sensitive credentials
 * before storing them in the database.
 * 
 * IMPORTANT: Set ENCRYPTION_KEY in your .env (32 bytes, can be base64 encoded)
 */

import crypto from 'crypto';

const IV_LENGTH = 16; // AES block size

/**
 * Get the encryption key, handling both raw and base64 formats
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY || '';
  
  if (!rawKey) {
    throw new Error('❌ ENCRYPTION_KEY manquant dans .env');
  }

  // Try base64 first (if it looks like base64)
  if (rawKey.includes('/') || rawKey.includes('+') || rawKey.endsWith('=')) {
    const decoded = Buffer.from(rawKey, 'base64');
    if (decoded.length >= 32) {
      return decoded.subarray(0, 32); // Take first 32 bytes
    }
  }

  // Otherwise treat as raw string
  if (rawKey.length >= 32) {
    return Buffer.from(rawKey.substring(0, 32));
  }

  throw new Error(
    '❌ ENCRYPTION_KEY invalide. Doit faire au moins 32 caractères ou être une clé base64 de 32+ bytes. ' +
    'Génère-en une avec: openssl rand -base64 32'
  );
}

/**
 * Encrypt a string using AES-256-CBC
 * Returns format: iv:encryptedData (hex encoded)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Format: iv:encrypted (both hex encoded)
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 */
export function decrypt(text: string): string {
  const key = getEncryptionKey();

  const [ivHex, encryptedHex] = text.split(':');
  
  if (!ivHex || !encryptedHex) {
    throw new Error('❌ Format de données chiffrées invalide');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string looks like it's already encrypted
 * (has the iv:data format with valid hex)
 */
export function isEncrypted(text: string): boolean {
  if (!text || !text.includes(':')) return false;
  
  const [ivHex, dataHex] = text.split(':');
  
  // IV should be 32 hex chars (16 bytes)
  if (!ivHex || ivHex.length !== 32) return false;
  
  // Both parts should be valid hex
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(ivHex) && hexRegex.test(dataHex || '');
}

/**
 * Safely decrypt - returns original if not encrypted or on error
 */
export function safeDecrypt(text: string): string {
  if (!text) return text;
  
  if (!isEncrypted(text)) {
    return text; // Not encrypted, return as-is
  }

  try {
    return decrypt(text);
  } catch {
    console.warn('⚠️ Failed to decrypt, returning original');
    return text;
  }
}
