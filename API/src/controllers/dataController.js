import { 
  sendSuccess, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  sendSuccessCreate
} from '../utils/response.js';
import mongoose from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Lazy load service to avoid circular dependencies
const getDataService = async () => {
  // Use mock service if available (for testing)
  if (global.mockDataService) {
    return global.mockDataService;
  }
  
  const dataService = await import('../services/dataService.js');
  return dataService;
};

/**
 * Store encrypted data
 */
export const storeData = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { encryption_id, text, encryptionKey } = req.body;
    
    // Validate required fields
    if (!encryption_id || !isValidObjectId(encryption_id)) {
      return sendValidationError('Valid encryption ID is required');
    }
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return sendValidationError('Text content is required and cannot be empty');
    }
    
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
      return sendValidationError('64-digit encryption key is required');
    }
    
    // Check text size limit (1MB)
    if (text.length > 1000000) {
      return sendValidationError('Text size exceeds 1MB limit');
    }
    
    const dataService = await getDataService();
    const result = await dataService.storeEncryptedData(
      userId, 
      encryption_id, // Pass as ObjectId string, not parsed as int
      text, 
      encryptionKey,
      req
    );
    
    return sendSuccessCreate('Data stored successfully', result);
    
  } catch (error) {
    console.error('Store data error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('access denied')) {
      return sendNotFoundError(error.message);
    }
    
    if (error.message.includes('required') ||
        error.message.includes('rate limit') ||
        error.message.includes('encryption key') ||
        error.message.includes('attempts')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to store data');
  }
};

/**
 * Get decrypted data
 */
export const getData = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { encryptionId } = req.params;
    const { passphrase, offset = 0, limit = 10 } = req.query;
    
    // Validate required fields - passphrase is actually the encryption key
    if (!passphrase || typeof passphrase !== 'string' || passphrase.length !== 64) {
      return sendValidationError('64-digit encryption key is required');
    }
    
    if (!encryptionId || !isValidObjectId(encryptionId)) {
      return sendValidationError('Valid encryption ID is required');
    }
    
    // Validate pagination parameters
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 10;
    
    if (offsetNum < 0) {
      return sendValidationError('Offset must be non-negative');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      return sendValidationError('Limit must be between 1 and 100');
    }
    
    const dataService = await getDataService();
    const result = await dataService.getDecryptedData(
      userId, 
      encryptionId, // Pass as ObjectId string, not parsed as int
      passphrase, // This is actually the encryption key
      req,
      offsetNum,
      limitNum
    );
    
    return sendSuccess(result);
    
  } catch (error) {
    console.error('Get data error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('access denied')) {
      return sendNotFoundError(error.message);
    }
    
    if (error.message.includes('required') ||
        error.message.includes('rate limit') ||
        error.message.includes('encryption key') ||
        error.message.includes('attempts')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to retrieve data');
  }
};

/**
 * Decrypt data with encryption key in request body
 */
export const decryptData = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { encryptionId } = req.params;
    const { encryptionKey, offset = 0, limit = 10 } = req.body;
    
    // Validate required fields
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
      return sendValidationError('64-digit encryption key is required');
    }
    
    if (!encryptionId || !isValidObjectId(encryptionId)) {
      return sendValidationError('Valid encryption ID is required');
    }
    
    // Validate pagination parameters
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 10;
    
    if (offsetNum < 0) {
      return sendValidationError('Offset must be non-negative');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      return sendValidationError('Limit must be between 1 and 100');
    }
    
    const dataService = await getDataService();
    const result = await dataService.getDecryptedData(
      userId, 
      encryptionId,
      encryptionKey,
      req,
      offsetNum,
      limitNum
    );
    
    return sendSuccess(result);
    
  } catch (error) {
    console.error('Decrypt data error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('access denied')) {
      return sendNotFoundError(error.message);
    }
    
    if (error.message.includes('required') ||
        error.message.includes('rate limit') ||
        error.message.includes('encryption key') ||
        error.message.includes('attempts')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to decrypt data');
  }
};

/**
 * Update encrypted data
 */
export const updateData = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { dataId } = req.params;
    const { text, encryptionKey } = req.body;
    
    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return sendValidationError('Text content is required and cannot be empty');
    }
    
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
      return sendValidationError('64-digit encryption key is required');
    }
    
    if (!dataId || !isValidObjectId(dataId)) {
      return sendValidationError('Valid data ID is required');
    }
    
    const dataService = await getDataService();
    const result = await dataService.updateEncryptedData(
      userId, 
      dataId, 
      text.trim(), 
      encryptionKey, 
      req
    );
    
    return sendSuccess(result);
    
  } catch (error) {
    console.error('Update data error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('access denied')) {
      return sendNotFoundError(error.message);
    }
    
    if (error.message.includes('empty') ||
        error.message.includes('required') ||
        error.message.includes('rate limit') ||
        error.message.includes('encryption key') ||
        error.message.includes('attempts')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to update data');
  }
};

/**
 * Delete encrypted data
 */
export const deleteData = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { dataId } = req.params;
    
    // Validate required fields
    if (!dataId || !isValidObjectId(dataId)) {
      return sendValidationError('Valid data ID is required');
    }
    
    const dataService = await getDataService();
    const result = await dataService.deleteEncryptedData(userId, dataId);
    
    return sendSuccess(result);
    
  } catch (error) {
    console.error('Delete data error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('deletion failed')) {
      return sendNotFoundError(error.message);
    }
    
    return sendServerError('Failed to delete data');
  }
}; 