/**
 * Mock Data Service for Testing
 * 
 * This mock service simulates encrypted data storage and retrieval without database dependencies.
 */

import mongoose from 'mongoose';

// Mock data database
const mockData = new Map();

/**
 * Generate a test ObjectId
 */
function generateTestObjectId() {
  return new mongoose.Types.ObjectId();
}

/**
 * Store encrypted data - matches real service interface
 */
export async function storeEncryptedData(userId, encryptionId, text, encryptionKey, req) {
  // Validate inputs
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!encryptionId || typeof encryptionId !== 'string') {
    throw new Error('Valid encryption ID is required');
  }
  
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text content is required');
  }
  
  if (!encryptionKey || typeof encryptionKey !== 'string') {
    throw new Error('64-character encryption key is required');
  }
  
  if (encryptionKey.length !== 64) {
    throw new Error('64-character encryption key is required');
  }
  
  // Check if encryption key contains only valid characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(encryptionKey)) {
    throw new Error('Encryption key must contain only alphanumeric characters');
  }
  
  if (text.length > 1000000) { // 1MB limit
    throw new Error('Text content exceeds maximum size limit');
  }
  
  // Mock encryption - in real implementation this would encrypt the text
  const encryptedText = `encrypted_${text}`;
  
  const dataId = generateTestObjectId();
  
  const dataEntry = {
    data_id: dataId,
    user_id: userId,
    encryption_id: encryptionId,
    encrypted_text: encryptedText,
    encryption_key: encryptionKey, // Store for mock verification
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockData.set(dataEntry.data_id.toString(), dataEntry);
  
  return {
    message: 'Data stored successfully',
    data_id: dataEntry.data_id,
    encryption_id: dataEntry.encryption_id,
    created_at: dataEntry.created_at
  };
}

/**
 * Get decrypted data - matches real service interface
 */
export async function getDecryptedData(userId, encryptionId, encryptionKey, req, offset = 0, limit = 10) {
  // Validate inputs
  if (!encryptionId || typeof encryptionId !== 'string') {
    throw new Error('Valid encryption ID is required');
  }
  
  if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
    throw new Error('64-character encryption key is required');
  }
  
  // Get data entries for user and encryption
  const userDataEntries = Array.from(mockData.values())
    .filter(entry => 
      entry.user_id === userId && 
      entry.encryption_id === encryptionId
    );
    
  if (userDataEntries.length === 0) {
    return {
      data: [],
      total: 0,
      pagination: {
        limit: limit,
        offset: offset,
        total: 0
      }
    };
  }
  
  // Verify encryption key for first entry (mock verification)
  const firstEntry = userDataEntries[0];
  const isValidKey = firstEntry.encryption_key === encryptionKey;
  
  if (!isValidKey) {
    throw new Error('Invalid encryption key');
  }
  
  // Apply pagination
  const paginatedEntries = userDataEntries
    .slice(offset, offset + limit)
    .map(entry => ({
      data_id: entry.data_id,
      text: entry.encrypted_text.replace('encrypted_', ''), // Mock decryption
      created_at: entry.created_at
    }));
  
  return {
    data: paginatedEntries,
    total: userDataEntries.length,
    pagination: {
      limit: limit,
      offset: offset,
      total: userDataEntries.length
    }
  };
}

/**
 * Update encrypted data - matches real service interface
 */
export async function updateEncryptedData(userId, dataId, text, encryptionKey, req) {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!dataId) {
    throw new Error('Data ID is required');
  }
  
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text content is required');
  }
  
  if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
    throw new Error('64-character encryption key is required');
  }
  
  const dataEntry = mockData.get(dataId.toString());
  
  if (!dataEntry) {
    throw new Error('Data not found');
  }
  
  if (dataEntry.user_id !== userId) {
    throw new Error('Access denied');
  }
  
  if (dataEntry.encryption_key !== encryptionKey) {
    throw new Error('Invalid encryption key');
  }
  
  // Update the entry
  dataEntry.encrypted_text = `encrypted_${text}`;
  dataEntry.updated_at = new Date().toISOString();
  
  return {
    message: 'Data updated successfully',
    data_id: dataEntry.data_id,
    updated_at: dataEntry.updated_at
  };
}

/**
 * Delete encrypted data - matches real service interface  
 */
export async function deleteEncryptedData(userId, dataId) {
  // Input validation
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  if (!dataId) {
    throw new Error('Data ID is required');
  }
  
  const dataEntry = mockData.get(dataId.toString());
  
  if (!dataEntry) {
    throw new Error('Data not found');
  }
  
  if (dataEntry.user_id !== userId) {
    throw new Error('Access denied');
  }
  
  mockData.delete(dataId.toString());
  
  return {
    message: 'Data deleted successfully',
    data_id: dataId
  };
}

/**
 * Clear all mock data (for test cleanup)
 */
export function clearMockData() {
  mockData.clear();
}

/**
 * Get all mock data (for debugging)
 */
export function getMockData() {
  return Array.from(mockData.values());
} 