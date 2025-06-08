import { UserEncryption, User, EncryptedData } from '../models/index.js';
import mongoose from 'mongoose';

/**
 * Create new encryption
 */
export const create = async (encryptionData) => {
  try {
    const { user_id, name, salt, verification_value, encryption_key } = encryptionData;
    
    const encryption = new UserEncryption({
      userId: user_id,
      name,
      salt,
      verificationValue: verification_value,
      encryptionKey: encryption_key
    });
    
    await encryption.save();
    return encryption.toJSON();
  } catch (error) {
    console.error('Error creating encryption:', error.message);
    throw error;
  }
};

/**
 * Find encryption by ID and user ID
 */
export const findByIdAndUserId = async (encryptionId, userId) => {
  try {
    const encryption = await UserEncryption.findOne({
      _id: encryptionId,
      userId: userId
    }).populate('userId', 'name email');
    
    return encryption ? encryption.toJSON() : null;
  } catch (error) {
    console.error('Error finding encryption:', error.message);
    throw error;
  }
};

/**
 * Find all encryptions for a user (excluding sensitive data)
 */
export const findByUserId = async (userId) => {
  try {
    const encryptions = await UserEncryption.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'encrypted_data',
          localField: '_id',
          foreignField: 'encryptionId',
          as: 'encryptedData'
        }
      },
      {
        $project: {
          encryption_id: '$_id',
          user_id: '$userId',
          name: 1,
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          data_count: { $size: '$encryptedData' }
        }
      },
      { $sort: { created_at: -1 } }
    ]);
    
    return encryptions;
  } catch (error) {
    console.error('Error finding user encryptions:', error.message);
    throw error;
  }
};

/**
 * Update encryption name
 */
export const updateName = async (encryptionId, userId, newName) => {
  try {
    const result = await UserEncryption.updateOne(
      { _id: encryptionId, userId: userId },
      { name: newName }
    );
    
    return result.modifiedCount > 0;
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
    const result = await UserEncryption.updateOne(
      { _id: encryptionId, userId: userId },
      { encryptionKey: newKey }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating encryption key:', error.message);
    throw error;
  }
};

/**
 * Delete encryption (cascade will handle related data)
 */
export const deleteEncryption = async (encryptionId, userId) => {
  try {
    // MongoDB doesn't have automatic cascade, so we need to handle it manually
    await EncryptedData.deleteMany({ encryptionId });
    
    const result = await UserEncryption.deleteOne({
      _id: encryptionId,
      userId: userId
    });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting encryption:', error.message);
    throw error;
  }
};

/**
 * Check if encryption name exists for user
 */
export const nameExistsForUser = async (name, userId, excludeEncryptionId = null) => {
  try {
    const query = {
      name,
      userId: userId
    };
    
    if (excludeEncryptionId) {
      query._id = { $ne: excludeEncryptionId };
    }
    
    const count = await UserEncryption.countDocuments(query);
    return count > 0;
  } catch (error) {
    console.error('Error checking encryption name:', error.message);
    throw error;
  }
};

/**
 * Get encryption statistics
 */
export const getEncryptionStats = async (encryptionId, userId) => {
  try {
    const result = await UserEncryption.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(encryptionId),
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'encrypted_data',
          localField: '_id',
          foreignField: 'encryptionId',
          as: 'encryptedData'
        }
      },
      {
        $project: {
          encryption_id: '$_id',
          user_id: '$userId',
          encryption_name: '$name',
          total_records: { $size: '$encryptedData' },
          first_record_date: {
            $cond: {
              if: { $gt: [{ $size: '$encryptedData' }, 0] },
              then: { $min: '$encryptedData.createdAt' },
              else: null
            }
          },
          latest_record_date: {
            $cond: {
              if: { $gt: [{ $size: '$encryptedData' }, 0] },
              then: { $max: '$encryptedData.createdAt' },
              else: null
            }
          },
          encryption_created_at: '$createdAt',
          encryption_updated_at: '$updatedAt'
        }
      }
    ]);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error getting encryption stats:', error.message);
    throw error;
  }
};

/**
 * Find encryptions by user with data count
 */
export const findByUserIdWithStats = async (userId, limit = 10, offset = 0) => {
  try {
    const result = await UserEncryption.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'encrypted_data',
          localField: '_id',
          foreignField: 'encryptionId',
          as: 'encryptedData'
        }
      },
      {
        $project: {
          encryption_id: '$_id',
          name: 1,
          created_at: '$createdAt',
          updated_at: '$updatedAt',
          data_count: { $size: '$encryptedData' },
          latest_data_date: {
            $cond: {
              if: { $gt: [{ $size: '$encryptedData' }, 0] },
              then: { $max: '$encryptedData.createdAt' },
              else: null
            }
          }
        }
      },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit }
    ]);
    
    const total = await UserEncryption.countDocuments({ userId });
    
    return {
      encryptions: result,
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error finding encryptions with stats:', error.message);
    throw error;
  }
}; 