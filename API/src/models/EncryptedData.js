import mongoose from 'mongoose';

const encryptedDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  encryptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserEncryption',
    required: true,
    index: true
  },
  encryptedData: {
    type: String,
    required: true,
    // Single encrypted data field - can be very large
  },
  aad: {
    type: String,
    maxlength: 255,
    default: null,
    // Additional Authenticated Data
  }
}, {
  timestamps: true,
  collection: 'encrypted_data',
  toJSON: {
    transform: function(doc, ret) {
      ret.data_id = ret._id;
      ret.user_id = ret.userId;
      ret.encryption_id = ret.encryptionId;
      ret.encrypted_data = ret.encryptedData;
      ret.created_at = ret.createdAt;
      ret.updated_at = ret.updatedAt;
      delete ret._id;
      delete ret.__v;
      delete ret.userId;
      delete ret.encryptionId;
      delete ret.encryptedData;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  }
});

// Indexes
encryptedDataSchema.index({ userId: 1, encryptionId: 1 });
encryptedDataSchema.index({ createdAt: -1 });
encryptedDataSchema.index({ encryptionId: 1, createdAt: -1 });

const EncryptedData = mongoose.model('EncryptedData', encryptedDataSchema);

export default EncryptedData; 