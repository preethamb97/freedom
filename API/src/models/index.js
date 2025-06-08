import mongoose from '../config/database.js';
import User from './User.js';
import UserEncryption from './UserEncryption.js';
import EncryptedData from './EncryptedData.js';
import RateLimit from './RateLimit.js';

// MongoDB doesn't require explicit associations like Sequelize
// Relationships are handled through ObjectId references and populate()

// Export models
export {
  mongoose,
  User,
  UserEncryption,
  EncryptedData,
  RateLimit
};

// Export default for convenience
export default {
  mongoose,
  User,
  UserEncryption,
  EncryptedData,
  RateLimit
}; 