/**
 * Mock Encryption Service for Testing
 * 
 * This mock service simulates encryption management without database dependencies.
 */

import mongoose from 'mongoose';

// Mock encryption database
const mockEncryptions = new Map();

/**
 * Generate a test ObjectId
 */
function generateTestObjectId() {
  return new mongoose.Types.ObjectId();
}

/**
 * Create new encryption - matches real service interface
 */
export async function createEncryption(userId, name, encryptionKey) {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Encryption name is required');
  }
  
  if (name.length > 100) {
    throw new Error('Encryption name must be 100 characters or less');
  }
  
  // Validate encryption key
  if (!encryptionKey || typeof encryptionKey !== 'string') {
    throw new Error('Encryption key must be exactly 64 characters long');
  }
  
  if (encryptionKey.length !== 64) {
    throw new Error('Encryption key must be exactly 64 characters long');
  }
  
  // Check if encryption key contains only valid characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(encryptionKey)) {
    throw new Error('Encryption key must contain only alphanumeric characters');
  }
  
  // Check if encryption with same name exists for user
  const existingEncryption = Array.from(mockEncryptions.values())
    .find(enc => enc.user_id === userId && enc.name.trim() === name.trim());
    
  if (existingEncryption) {
    throw new Error('Encryption with this name already exists');
  }
  
  const encryptionId = generateTestObjectId();
  
  const encryption = {
    encryption_id: encryptionId,
    user_id: userId,
    name: name.trim(),
    encryption_key: encryptionKey, // Store the actual key for testing
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockEncryptions.set(encryptionId.toString(), encryption);
  
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
  // Input validation
  if (!encryptionId) {
    throw new Error('Encryption ID is required');
  }
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const encryption = mockEncryptions.get(encryptionId.toString());
  
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
  
  // Check if encryption key contains only valid characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(encryptionKey)) {
    throw new Error('Encryption key must contain only alphanumeric characters');
  }
  
  // Mock verification - compare actual keys for testing
  const isValid = encryption.encryption_key === encryptionKey;
  
  return {
    isValid: isValid,
    message: isValid ? 'Encryption key verified' : 'Invalid encryption key'
  };
}

/**
 * Clear all mock encryptions (for test cleanup)
 */
export function clearMockEncryptions() {
  mockEncryptions.clear();
}

/**
 * Get all mock encryptions (for debugging)
 */
export function getMockEncryptions() {
  return Array.from(mockEncryptions.values());
} 