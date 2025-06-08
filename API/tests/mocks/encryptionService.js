/**
 * Mock Encryption Service for Testing
 * 
 * This mock service simulates encryption management without database dependencies.
 */

// Mock encryption database
const mockEncryptions = new Map();
let encryptionIdCounter = 1;

/**
 * Create new encryption - matches real service interface
 */
export async function createEncryption(userId, name, encryptionKey) {
  // Validate encryption key
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error('Encryption key must be exactly 64 characters long');
  }
  
  // Check if encryption with same name exists for user
  const existingEncryption = Array.from(mockEncryptions.values())
    .find(enc => enc.user_id === userId && enc.name === name);
    
  if (existingEncryption) {
    throw new Error('Encryption with this name already exists');
  }
  
  const encryptionId = `67${encryptionIdCounter.toString().padStart(22, '0')}`; // Mock ObjectId format
  encryptionIdCounter++;
  
  const encryption = {
    encryption_id: encryptionId,
    user_id: userId,
    name: name,
    encryption_key: encryptionKey, // Store the actual key for testing
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockEncryptions.set(encryptionId, encryption);
  
  return {
    encryption_id: encryption.encryption_id,
    name: encryption.name,
    created_at: encryption.created_at
  };
}

/**
 * Get user encryptions
 */
export async function getUserEncryptions(userId) {
  const userEncryptions = Array.from(mockEncryptions.values())
    .filter(enc => enc.user_id === userId)
    .map(enc => ({
      encryption_id: enc.encryption_id,
      name: enc.name,
      created_at: enc.created_at
    }));
    
  return userEncryptions;
}

/**
 * Verify encryption key - matches real service interface
 */
export async function verifyEncryptionKey(encryptionId, userId, encryptionKey) {
  const encryption = mockEncryptions.get(encryptionId); // Don't parse as int, use as string
  
  if (!encryption) {
    throw new Error('Encryption not found');
  }
  
  if (encryption.user_id !== userId) {
    throw new Error('Access denied to this encryption');
  }
  
  // Validate encryption key format first
  if (!encryptionKey || typeof encryptionKey !== 'string') {
    throw new Error('Encryption key must be exactly 64 characters long');
  }
  
  if (encryptionKey.length !== 64) {
    throw new Error('Encryption key must be exactly 64 characters long');
  }
  
  // Mock verification - compare actual keys for testing
  const isValid = encryption.encryption_key === encryptionKey;
  
  return {
    isValid: isValid, // Changed from 'valid' to 'isValid' to match real service
    message: isValid ? 'Encryption key verified' : 'Invalid encryption key'
  };
}

/**
 * Clear all mock encryptions (for test cleanup)
 */
export function clearMockEncryptions() {
  mockEncryptions.clear();
  encryptionIdCounter = 1;
}

/**
 * Get all mock encryptions (for debugging)
 */
export function getMockEncryptions() {
  return Array.from(mockEncryptions.values());
} 