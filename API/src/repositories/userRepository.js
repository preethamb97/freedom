import { User, UserEncryption, EncryptedData } from '../models/index.js';

/**
 * Find user by Google ID
 */
export const findByGoogleId = async (googleId) => {
  try {
    const user = await User.findOne({
      googleId: googleId
    });
    
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by Google ID:', error.message);
    throw error;
  }
};

/**
 * Find user by user ID
 */
export const findById = async (userId, includeAssociations = false) => {
  try {
    let user;
    
    if (includeAssociations) {
      // Use aggregation to get related data
      const result = await User.aggregate([
        { $match: { _id: userId } },
        {
          $lookup: {
            from: 'user_encryption',
            localField: '_id',
            foreignField: 'userId',
            as: 'encryptions',
            pipeline: [
              {
                $project: {
                  encryption_id: '$_id',
                  name: 1,
                  created_at: '$createdAt',
                  updated_at: '$updatedAt'
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'encrypted_data',
            localField: '_id',
            foreignField: 'userId',
            as: 'encryptedData',
            pipeline: [
              {
                $project: {
                  data_id: '$_id',
                  encryption_id: '$encryptionId',
                  created_at: '$createdAt',
                  updated_at: '$updatedAt'
                }
              }
            ]
          }
        }
      ]);
      
      user = result[0] || null;
    } else {
      user = await User.findById(userId);
      user = user ? user.toJSON() : null;
    }
    
    return user;
  } catch (error) {
    console.error('Error finding user by ID:', error.message);
    throw error;
  }
};

/**
 * Create new user
 */
export const create = async (userData) => {
  try {
    const { google_id, name, email, photo } = userData;
    
    const user = new User({
      googleId: google_id,
      name,
      email,
      photo
    });
    
    await user.save();
    return user.toJSON();
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
};

/**
 * Update user information
 */
export const update = async (userId, updateData) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error updating user:', error.message);
    throw error;
  }
};

/**
 * Delete user (cascade will handle related data)
 */
export const deleteUser = async (userId) => {
  try {
    // MongoDB doesn't have automatic cascade, so we need to handle it manually
    await UserEncryption.deleteMany({ userId });
    await EncryptedData.deleteMany({ userId });
    
    const result = await User.findByIdAndDelete(userId);
    return result !== null;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId) => {
  try {
    const result = await User.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: 'user_encryption',
          localField: '_id',
          foreignField: 'userId',
          as: 'encryptions'
        }
      },
      {
        $lookup: {
          from: 'encrypted_data',
          localField: '_id',
          foreignField: 'userId',
          as: 'encryptedData'
        }
      },
      {
        $project: {
          user_id: '$_id',
          name: 1,
          email: 1,
          total_encryptions: { $size: '$encryptions' },
          total_encrypted_records: { $size: '$encryptedData' },
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
          user_created_at: '$createdAt'
        }
      }
    ]);
    
    return result[0] || null;
  } catch (error) {
    console.error('Error getting user stats:', error.message);
    throw error;
  }
};

/**
 * Check if user exists by email
 */
export const existsByEmail = async (email) => {
  try {
    const count = await User.countDocuments({ email });
    return count > 0;
  } catch (error) {
    console.error('Error checking user existence by email:', error.message);
    throw error;
  }
};

/**
 * Search users by name or email (for admin purposes)
 */
export const searchUsers = async (searchTerm, limit = 10, offset = 0) => {
  try {
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
    
    const total = await User.countDocuments({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    });
    
    return {
      users: users.map(user => user.toJSON()),
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error searching users:', error.message);
    throw error;
  }
}; 