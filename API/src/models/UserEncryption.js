import mongoose from 'mongoose';

const userEncryptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 255
  },
  salt: {
    type: String,
    maxlength: 255,
    default: null,
    // Legacy salt column - nullable for new encryption key approach
  },
  verificationValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  encryptionKey: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // 64-character encryption key (letters and numbers)
        return v && v.length === 64 && /^[a-zA-Z0-9]{64}$/.test(v);
      },
      message: 'Encryption key must be exactly 64 alphanumeric characters'
    }
  }
}, {
  timestamps: true,
  collection: 'user_encryption',
  toJSON: {
    transform: function(doc, ret) {
      ret.encryption_id = ret._id;
      ret.user_id = ret.userId;
      ret.verification_value = ret.verificationValue;
      ret.encryption_key = ret.encryptionKey;
      ret.created_at = ret.createdAt;
      ret.updated_at = ret.updatedAt;
      delete ret._id;
      delete ret.__v;
      delete ret.userId;
      delete ret.verificationValue;
      delete ret.encryptionKey;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  }
});

// Indexes
userEncryptionSchema.index({ userId: 1 });
userEncryptionSchema.index({ userId: 1, name: 1 }, { unique: true });

// Custom validations
userEncryptionSchema.pre('save', function(next) {
  // Only check for weak patterns in production
  if (process.env.NODE_ENV !== 'test') {
    // Check for weak patterns
    const weakPatterns = [
      'A'.repeat(64),
      'a'.repeat(64),
      '1'.repeat(64),
      '0'.repeat(64),
      '1234567890123456789012345678901234567890123456789012345678901234',
      '9876543210987654321098765432109876543210987654321098765432109876',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKL',
      'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl'
    ];
    
    if (weakPatterns.includes(this.encryptionKey)) {
      return next(new Error('Encryption key uses a weak pattern, please generate a new one'));
    }
    
    // Check if all same character
    if (/^(.)\1{63}$/.test(this.encryptionKey)) {
      return next(new Error('Encryption key cannot be all the same character'));
    }
  }
  
  next();
});

const UserEncryption = mongoose.model('UserEncryption', userEncryptionSchema);

export default UserEncryption; 