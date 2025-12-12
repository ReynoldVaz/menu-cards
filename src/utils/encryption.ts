/**
 * Encryption Utilities for Sensitive Data
 * Used to encrypt Twilio auth tokens before storing in Firestore
 * 
 * SECURITY: Encryption keys must be set as Vercel environment variables:
 * - ENCRYPTION_KEY (32-character hex string)
 * - ENCRYPTION_IV (16-character hex string)
 * 
 * Generate keys with:
 * - ENCRYPTION_KEY: openssl rand -hex 32
 * - ENCRYPTION_IV: openssl rand -hex 16
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Get encryption key from environment (must be 32 bytes hex)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.ENCRYPTION_IV;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    'ENCRYPTION_KEY must be set as a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32'
  );
}

if (!ENCRYPTION_IV || ENCRYPTION_IV.length !== 32) {
  throw new Error(
    'ENCRYPTION_IV must be set as a 32-character hex string (16 bytes). Generate with: openssl rand -hex 16'
  );
}

/**
 * Encrypt sensitive text (e.g., Twilio auth token)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
export function encryptToken(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to encrypt must be a non-empty string');
  }

  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ENCRYPTION_IV, 'hex');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return format: iv:encryptedData (for easy parsing)
    return `${ENCRYPTION_IV}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Error encrypting token:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt encrypted text
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted plain text
 */
export function decryptToken(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Encrypted text must be a non-empty string');
  }

  try {
    // Split iv and encrypted data
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format. Expected: iv:encryptedData');
    }

    const [ivHex, encryptedData] = parts;

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Decryption] Error decrypting token:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Check if a token is encrypted (has the iv: prefix)
 * @param {string} token - Token to check
 * @returns {boolean} - True if encrypted
 */
export function isEncrypted(token) {
  return typeof token === 'string' && token.includes(':') && token.split(':').length === 2;
}

/**
 * Safely get decrypted token (handles both encrypted and plain text)
 * Used during migration period when some tokens may not be encrypted yet
 * @param {string} token - Token (encrypted or plain)
 * @returns {string} - Plain text token
 */
export function safeDecrypt(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  // If already encrypted, decrypt it
  if (isEncrypted(token)) {
    return decryptToken(token);
  }

  // Otherwise, return as-is (plain text)
  console.warn('[Encryption] Token is not encrypted. Consider running migration script.');
  return token;
}
