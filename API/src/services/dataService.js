import * as dataRepository from '../repositories/dataRepository.js';
import * as encryptionRepository from '../repositories/encryptionRepository.js';
import { encryptText, decryptText, verifyEncryptionKey } from '../helpers/encryption.js';
import { checkRateLimit, recordFailedAttempt, resetFailedAttempts, getClientIP } from '../helpers/rateLimiter.js';

/**
 * Store encrypted data
 */
export const storeEncryptedData = async (userId, encryptionId, text, encryptionKey, req) => {
  try {
    const clientIP = getClientIP(req);
    
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text to encrypt cannot be empty');
    }
    
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('64-digit encryption key is required');
    }
    
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(clientIP, encryptionId);
    if (rateLimitCheck.isBlocked) {
      throw new Error(rateLimitCheck.message);
    }
    
    // Get encryption details
    const encryption = await encryptionRepository.findByIdAndUserId(encryptionId, userId);
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    // Verify encryption key
    const isValidKey = verifyEncryptionKey(encryptionKey, encryption.verification_value);
    
    if (!isValidKey) {
      // Record failed attempt
      const failedAttempt = await recordFailedAttempt(clientIP, encryptionId);
      throw new Error(failedAttempt.message);
    }
    
    // Reset failed attempts on successful verification
    await resetFailedAttempts(clientIP, encryptionId);
    
    // Encrypt the text using the encryption key directly
    const encryptedData = encryptText(text.trim(), encryptionKey);
    
    // Store in database
    const data = await dataRepository.create({
      user_id: userId,
      encryption_id: encryptionId,
      encrypted_data: JSON.stringify(encryptedData)
    });
    
    return {
      data_id: data.data_id,
      encryption_id: data.encryption_id,
      created_at: data.created_at,
      // Note: We don't return the encrypted data for security
    };
    
  } catch (error) {
    console.error('Error storing encrypted data:', error.message);
    throw error;
  }
};

/**
 * Retrieve and decrypt data
 */
export const getDecryptedData = async (userId, encryptionId, encryptionKey, req, offset = 0, limit = 10) => {
  try {
    const clientIP = getClientIP(req);
    
    // Validate encryption key
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('64-digit encryption key is required');
    }
    
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(clientIP, encryptionId);
    if (rateLimitCheck.isBlocked) {
      throw new Error(rateLimitCheck.message);
    }
    
    // Get encryption details
    const encryption = await encryptionRepository.findByIdAndUserId(encryptionId, userId);
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    // Verify encryption key
    const isValidKey = verifyEncryptionKey(encryptionKey, encryption.verification_value);
    
    if (!isValidKey) {
      // Record failed attempt
      const failedAttempt = await recordFailedAttempt(clientIP, encryptionId);
      throw new Error(failedAttempt.message);
    }
    
    // Reset failed attempts on successful verification
    await resetFailedAttempts(clientIP, encryptionId);
    
    // Get encrypted data from database with pagination
    const dataResult = await dataRepository.findByEncryptionIdWithPagination(encryptionId, userId, offset, limit);
    
    if (!dataResult || !dataResult.data || dataResult.data.length === 0) {
      return {
        encryption_name: encryption.name,
        data: [],
        total: dataResult?.total || 0,
        offset,
        limit,
        hasMore: false
      };
    }
    
    // Decrypt each data record
    const decryptedData = [];
    for (const record of dataResult.data) {
      try {
        const encryptedDataObj = JSON.parse(record.encrypted_data);
        const decryptedText = decryptText(encryptedDataObj, encryptionKey);
        
        decryptedData.push({
          data_id: record.data_id,
          text: decryptedText,
          created_at: record.created_at,
          updated_at: record.updated_at
        });
      } catch (decryptError) {
        console.error('Failed to decrypt data record:', record.data_id, decryptError.message);
        // Skip corrupted records
      }
    }
    
    return {
      encryption_name: encryption.name,
      data: decryptedData,
      total: dataResult.total,
      offset,
      limit,
      hasMore: (offset + limit) < dataResult.total
    };
    
  } catch (error) {
    console.error('Error getting decrypted data:', error.message);
    throw error;
  }
};

/**
 * Update encrypted data
 */
export const updateEncryptedData = async (userId, dataId, text, encryptionKey, req) => {
  try {
    const clientIP = getClientIP(req);
    
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text to encrypt cannot be empty');
    }
    
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('64-digit encryption key is required');
    }
    
    // Get data record
    const dataRecord = await dataRepository.findByIdAndUserId(dataId, userId);
    if (!dataRecord) {
      throw new Error('Data not found or access denied');
    }
    
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(clientIP, dataRecord.encryption_id);
    if (rateLimitCheck.isBlocked) {
      throw new Error(rateLimitCheck.message);
    }
    
    // Get encryption details
    const encryption = await encryptionRepository.findByIdAndUserId(dataRecord.encryption_id, userId);
    if (!encryption) {
      throw new Error('Encryption not found or access denied');
    }
    
    // Verify encryption key
    const isValidKey = verifyEncryptionKey(encryptionKey, encryption.verification_value);
    
    if (!isValidKey) {
      // Record failed attempt
      const failedAttempt = await recordFailedAttempt(clientIP, dataRecord.encryption_id);
      throw new Error(failedAttempt.message);
    }
    
    // Reset failed attempts on successful verification
    await resetFailedAttempts(clientIP, dataRecord.encryption_id);
    
    // Encrypt the new text
    const encryptedData = encryptText(text.trim(), encryptionKey);
    
    // Update in database
    const updated = await dataRepository.updateData(dataId, userId, JSON.stringify(encryptedData));
    
    if (!updated) {
      throw new Error('Data update failed');
    }
    
    return { success: true, message: 'Data updated successfully' };
    
  } catch (error) {
    console.error('Error updating encrypted data:', error.message);
    throw error;
  }
};

/**
 * Delete encrypted data
 */
export const deleteEncryptedData = async (userId, dataId) => {
  try {
    const deleted = await dataRepository.deleteData(dataId, userId);
    
    if (!deleted) {
      throw new Error('Data not found or deletion failed');
    }
    
    return { success: true, message: 'Data deleted successfully' };
    
  } catch (error) {
    console.error('Error deleting encrypted data:', error.message);
    throw error;
  }
};

/**
 * Get user's data statistics
 */
export const getUserDataStatistics = async (userId) => {
  try {
    const stats = await dataRepository.getUserDataStats(userId);
    
    return {
      total_records: stats.total_records,
      total_encryptions: stats.total_encryptions,
      first_record: stats.first_record,
      latest_record: stats.latest_record
    };
    
  } catch (error) {
    console.error('Error getting user data statistics:', error.message);
    throw error;
  }
}; 