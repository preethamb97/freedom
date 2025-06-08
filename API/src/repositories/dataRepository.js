import { EncryptedData, UserEncryption, User } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Store encrypted data
 */
export const storeData = async (dataInfo) => {
  try {
    const { user_id, encryption_id, encrypted_data } = dataInfo;
    
    const data = new EncryptedData({
      userId: user_id,
      encryptionId: encryption_id,
      encryptedData: encrypted_data
    });
    
    await data.save();
    return data.toJSON();
  } catch (error) {
    console.error('Error storing encrypted data:', error.message);
    throw error;
  }
};

/**
 * Get data by ID with user and encryption validation
 */
export const getDataById = async (dataId, userId) => {
  try {
    const data = await EncryptedData.findOne({
      _id: dataId,
      userId: userId
    })
    .populate('encryptionId', 'name encryptionKey verificationValue')
    .populate('userId', 'name email');
    
    return data ? data.toJSON() : null;
  } catch (error) {
    console.error('Error getting encrypted data:', error.message);
    throw error;
  }
};

/**
 * Get all data for specific encryption
 */
export const getDataByEncryption = async (encryptionId, userId, limit = 10, offset = 0) => {
  try {
    const data = await EncryptedData.find({
      encryptionId: encryptionId,
      userId: userId
    })
    .populate('encryptionId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
    
    const total = await EncryptedData.countDocuments({
      encryptionId: encryptionId,
      userId: userId
    });
    
    return {
      data: data.map(item => item.toJSON()),
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error getting encryption data:', error.message);
    throw error;
  }
};

/**
 * Update encrypted data
 */
export const updateData = async (dataId, userId, newEncryptedData) => {
  try {
    const result = await EncryptedData.updateOne(
      { _id: dataId, userId: userId },
      { encryptedData: newEncryptedData }
    );
    
    if (result.modifiedCount === 0) {
      return null;
    }
    
    // Return the updated data
    return await getDataById(dataId, userId);
  } catch (error) {
    console.error('Error updating encrypted data:', error.message);
    throw error;
  }
};

/**
 * Delete encrypted data
 */
export const deleteData = async (dataId, userId) => {
  try {
    const result = await EncryptedData.deleteOne({
      _id: dataId,
      userId: userId
    });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting encrypted data:', error.message);
    throw error;
  }
};

/**
 * Get all data for a user across all encryptions
 */
export const getDataByUser = async (userId, limit = 20, offset = 0) => {
  try {
    const data = await EncryptedData.find({
      userId: userId
    })
    .populate('encryptionId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
    
    const total = await EncryptedData.countDocuments({
      userId: userId
    });
    
    return {
      data: data.map(item => item.toJSON()),
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error getting user data:', error.message);
    throw error;
  }
};

/**
 * Get user's data statistics
 */
export const getUserDataStats = async (userId) => {
  try {
    const result = await EncryptedData.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total_records: { $sum: 1 },
          total_encryptions: { $addToSet: '$encryptionId' },
          first_record: { $min: '$createdAt' },
          latest_record: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          total_records: 1,
          total_encryptions: { $size: '$total_encryptions' },
          first_record: 1,
          latest_record: 1
        }
      }
    ]);
    
    return result[0] || {
      total_records: 0,
      total_encryptions: 0,
      first_record: null,
      latest_record: null
    };
  } catch (error) {
    console.error('Error getting user data stats:', error.message);
    throw error;
  }
};

/**
 * Get all data for specific encryption with pagination (alias for backward compatibility)
 */
export const findByEncryptionIdWithPagination = async (encryptionId, userId, offset = 0, limit = 10) => {
  return await getDataByEncryption(encryptionId, userId, limit, offset);
};

/**
 * Alias functions for compatibility with service layer
 */
export const create = storeData;
export const findByIdAndUserId = getDataById;
export const findByEncryptionId = async (encryptionId, userId) => {
  const result = await getDataByEncryption(encryptionId, userId, 1000, 0); // Get all data
  return result.data;
}; 