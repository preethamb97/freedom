import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError, 
  getEncryptionService 
} from '../utils/response.js';
import mongoose from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Create new encryption
 */
export const createEncryption = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, passphrase, encryptionKey } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return sendValidationError('Encryption name must be at least 3 characters long');
    }
    
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
      return sendValidationError('64-character encryption key is required');
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(encryptionKey)) {
      return sendValidationError('Encryption key must contain only letters and numbers');
    }
    
    const encryptionService = await getEncryptionService();
    const result = await encryptionService.createEncryption(userId, name.trim(), encryptionKey);
    
    return sendSuccess({
      message: 'Encryption created successfully',
      encryption: result
    }, 201);
    
  } catch (error) {
    console.error('Create encryption error:', error.message);
    
    if (error.message.includes('already exists')) {
      return sendValidationError(error.message);
    }
    
    if (error.message.includes('weak pattern') || 
        error.message.includes('character') ||
        error.message.includes('required')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to create encryption');
  }
};

/**
 * Get user encryptions
 */
export const getUserEncryptions = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const encryptionService = await getEncryptionService();
    const encryptions = await encryptionService.getUserEncryptions(userId);
    
    return sendSuccess({
      message: 'Encryptions retrieved successfully',
      encryptions,
      count: encryptions.length
    });
    
  } catch (error) {
    console.error('Get user encryptions error:', error.message);
    return sendServerError('Failed to retrieve encryptions');
  }
};

/**
 * Verify encryption key
 */
export const verifyEncryptionKey = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { encryptionId } = req.params;
    const { encryptionKey } = req.body;
    
    // Validate required fields
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length !== 64) {
      return sendValidationError('64-character encryption key is required');
    }
    
    if (!encryptionId || !isValidObjectId(encryptionId)) {
      return sendValidationError('Valid encryption ID is required');
    }
    
    const encryptionService = await getEncryptionService();
    const result = await encryptionService.verifyEncryptionKey(encryptionId, userId, encryptionKey);
    
    if (result.isValid) {
      return sendSuccess({
        message: result.message,
        verified: true
      });
    } else {
      return sendValidationError(result.message);
    }
    
  } catch (error) {
    console.error('Verify encryption key error:', error.message);
    
    if (error.message.includes('not found') || 
        error.message.includes('access denied')) {
      return sendNotFoundError(error.message);
    }
    
    if (error.message.includes('required') ||
        error.message.includes('character')) {
      return sendValidationError(error.message);
    }
    
    return sendServerError('Failed to verify encryption key');
  }
}; 