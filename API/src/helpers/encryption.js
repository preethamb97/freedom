import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generate a random salt
 */
export const generateSalt = () => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Generate a random IV
 */
export const generateIV = () => {
  return crypto.randomBytes(IV_LENGTH).toString('base64');
};

/**
 * Convert 64-digit encryption key to 32-byte buffer for AES-256
 */
const prepareEncryptionKey = (encryptionKey) => {
  // Take the 64-digit key and convert it to a 32-byte key for AES-256
  const keyBuffer = Buffer.from(encryptionKey, 'utf8');
  return crypto.createHash('sha256').update(keyBuffer).digest();
};

/**
 * Encrypt text using AES-256-GCM with encryption key
 */
export const encryptText = (text, encryptionKey) => {
  try {
    // Prepare the encryption key
    const key = prepareEncryptionKey(encryptionKey);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher with proper GCM mode
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Set Additional Authenticated Data (AAD)
    const aad = Buffer.from('encrypted-data-ui-v3', 'utf8');
    cipher.setAAD(aad);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('base64'),
      encrypted: encrypted.toString('base64'),
      tag: tag.toString('base64'),
      aad: aad.toString('base64')
    };
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt text using AES-256-GCM with encryption key
 */
export const decryptText = (encryptedData, encryptionKey) => {
  try {
    // Prepare the encryption key
    const key = prepareEncryptionKey(encryptionKey);
    
    // Convert from base64
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    
    // Handle AAD for backward compatibility
    let aad;
    if (encryptedData.aad) {
      aad = Buffer.from(encryptedData.aad, 'base64');
    } else {
      // Fallback for old data
      aad = Buffer.from('encrypted-data-ui', 'utf8');
    }
    
    // Create decipher with proper GCM mode
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Invalid encryption key or corrupted data');
  }
};

/**
 * Create verification value for encryption key validation
 */
export const createVerificationValue = (encryptionKey) => {
  const verificationText = 'key_valid';
  return encryptText(verificationText, encryptionKey);
};

/**
 * Verify encryption key using verification value
 */
export const verifyEncryptionKey = (encryptionKey, verificationValue) => {
  try {
    const decrypted = decryptText(verificationValue, encryptionKey);
    return decrypted === 'key_valid';
  } catch (error) {
    return false;
  }
};

/**
 * Secure memory cleanup function
 */
export const secureCleanup = (sensitiveData) => {
  if (Buffer.isBuffer(sensitiveData)) {
    sensitiveData.fill(0);
  } else if (typeof sensitiveData === 'string') {
    // Note: In JavaScript, strings are immutable, so we can't actually clear them
    // This is a limitation of the language
    sensitiveData = null;
  }
};

/**
 * Hash sensitive data for logging (without revealing actual content)
 */
export const hashForLogging = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
}; 