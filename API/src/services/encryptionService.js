import * as encryptionRepository from '../repositories/encryptionRepository.js';
import { createVerificationValue } from '../helpers/encryption.js';

/**
 * Validate 64-character encryption key
 */
const validateEncryptionKey = (key) => {
  if (!key) {
    throw new Error('64-character encryption key is required');
  }
  
  if (typeof key !== 'string') {
    throw new Error('Encryption key must be a string');
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(key)) {
    throw new Error('Encryption key must contain only letters and numbers');
  }
  
  if (key.length !== 64) {
    throw new Error(`Encryption key must be exactly 64 characters (provided: ${key.length})`);
  }
  
  // Check for weak patterns
  if (/^(.)\1{63}$/.test(key)) {
    throw new Error('Encryption key cannot be all the same character');
  }
  
  const lowercaseKey = key.toLowerCase();
  if (lowercaseKey === '0123456789'.repeat(6) + '0123') {
    throw new Error('Encryption key cannot be a simple repeating pattern');
  }
  
  if (lowercaseKey === 'abcdefghij'.repeat(6) + 'abcd') {
    throw new Error('Encryption key cannot be a simple repeating pattern');
  }
  
  // Check for other common weak patterns
  const weakPatterns = [
    '1234567890'.repeat(6) + '1234',
    '9876543210'.repeat(6) + '9876',
    'a'.repeat(64),
    'b'.repeat(64),
    '0'.repeat(64),
    '1'.repeat(64),
    'abcdefghijklmnopqrstuvwxyz'.repeat(2) + 'abcdefghijkl'
  ];
  
  if (weakPatterns.some(pattern => lowercaseKey === pattern.toLowerCase())) {
    throw new Error('Encryption key uses a weak pattern, please generate a new one');
  }
  
  return true;
};

/**
 * Create new encryption
 */
export const createEncryption = async (userId, name, encryptionKey) => {
  try {
    // Validate input
    if (!name || name.trim().length < 3) {
      throw new Error('Encryption name must be at least 3 characters long');
    }
    
    // Validate encryption key
    validateEncryptionKey(encryptionKey);
    
    // Check if name already exists for this user
    const nameExists = await encryptionRepository.nameExistsForUser(name.trim(), userId);
    if (nameExists) {
      throw new Error('An encryption with this name already exists');
    }
    
    // Create verification value using the encryption key
    const verificationValue = createVerificationValue(encryptionKey);
    
    // Create encryption record with the 64-digit key
    const encryption = await encryptionRepository.create({
      user_id: userId,
      name: name.trim(),
      salt: null, // No longer needed
      verification_value: verificationValue,
      encryption_key: encryptionKey
    });
    
    return {
      encryption_id: encryption.encryption_id,
      name: encryption.name,
      created_at: encryption.created_at,
      // Note: We don't return the encryption key for security reasons
    };
    
  } catch (error) {
    console.error('Error creating encryption:', error.message);
    throw error;
  }
};

/**
 * Get all encryptions for a user
 */
export const getUserEncryptions = async (userId) => {
  try {
    const encryptions = await encryptionRepository.findByUserId(userId);
    
    return encryptions.map(enc => ({
      encryption_id: enc.encryption_id,
      name: enc.name,
      created_at: enc.created_at,
      updated_at: enc.updated_at
      // Note: We don't include encryption_key for security reasons
    }));
  } catch (error) {
    console.error('Error getting user encryptions:', error.message);
    throw error;
  }
};

/**
 * Get encryption details (with verification ability)
 */
export const getEncryptionDetails = async (encryptionId, userId) => {
  try {
    const encryption = await encryptionRepository.findByIdAndUserId(encryptionId, userId);
    
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    return {
      encryption_id: encryption.encryption_id,
      name: encryption.name,
      verification_value: encryption.verification_value,
      encryption_key: encryption.encryption_key, // Include for verification/decryption
      created_at: encryption.created_at,
      updated_at: encryption.updated_at
    };
  } catch (error) {
    console.error('Error getting encryption details:', error.message);
    throw error;
  }
};

/**
 * Verify encryption key for an encryption
 */
export const verifyEncryptionKey = async (encryptionId, userId, providedKey) => {
  try {
    validateEncryptionKey(providedKey);
    
    const encryption = await encryptionRepository.findByIdAndUserId(encryptionId, userId);
    
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    // Compare the provided key with stored key
    const isValid = encryption.encryption_key === providedKey;
    
    return {
      isValid,
      message: isValid ? 'Encryption key verified' : 'Invalid encryption key'
    };
    
  } catch (error) {
    console.error('Error verifying encryption key:', error.message);
    throw error;
  }
};

/**
 * Update encryption name
 */
export const updateEncryptionName = async (encryptionId, userId, newName) => {
  try {
    // Validate input
    if (!newName || newName.trim().length < 3) {
      throw new Error('Encryption name must be at least 3 characters long');
    }
    
    // Check if new name already exists for this user (excluding current encryption)
    const nameExists = await encryptionRepository.nameExistsForUser(
      newName.trim(), 
      userId, 
      encryptionId
    );
    
    if (nameExists) {
      throw new Error('An encryption with this name already exists');
    }
    
    // Update the name
    const updated = await encryptionRepository.updateName(encryptionId, userId, newName.trim());
    
    if (!updated) {
      throw new Error('Encryption not found or update failed');
    }
    
    return { success: true, message: 'Encryption name updated successfully' };
    
  } catch (error) {
    console.error('Error updating encryption name:', error.message);
    throw error;
  }
};

/**
 * Update encryption key
 */
export const updateEncryptionKey = async (encryptionId, userId, newKey) => {
  try {
    // Validate new encryption key
    validateEncryptionKey(newKey);
    
    // Get current encryption details
    const encryption = await encryptionRepository.findByIdAndUserId(encryptionId, userId);
    
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    // Create new verification value with the new key
    const newVerificationValue = createVerificationValue(newKey);
    
    // Update the encryption key and verification value
    const updated = await encryptionRepository.updateEncryptionKey(encryptionId, userId, newKey);
    
    if (!updated) {
      throw new Error('Encryption key update failed');
    }
    
    return { success: true, message: 'Encryption key updated successfully' };
    
  } catch (error) {
    console.error('Error updating encryption key:', error.message);
    throw error;
  }
};

/**
 * Delete encryption
 */
export const deleteEncryption = async (encryptionId, userId) => {
  try {
    const deleted = await encryptionRepository.deleteEncryption(encryptionId, userId);
    
    if (!deleted) {
      throw new Error('Encryption not found or deletion failed');
    }
    
    return { success: true, message: 'Encryption deleted successfully' };
    
  } catch (error) {
    console.error('Error deleting encryption:', error.message);
    throw error;
  }
}; 