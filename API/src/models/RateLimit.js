import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    maxlength: 45, // Support IPv6
  },
  encryptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserEncryption',
    required: true,
  },
  failedAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  blockedUntil: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  collection: 'rate_limit',
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.ip_address = ret.ipAddress;
      ret.encryption_id = ret.encryptionId;
      ret.failed_attempts = ret.failedAttempts;
      ret.blocked_until = ret.blockedUntil;
      ret.created_at = ret.createdAt;
      ret.updated_at = ret.updatedAt;
      delete ret._id;
      delete ret.__v;
      delete ret.ipAddress;
      delete ret.encryptionId;
      delete ret.failedAttempts;
      delete ret.blockedUntil;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  }
});

// Indexes
rateLimitSchema.index({ ipAddress: 1, encryptionId: 1 }, { unique: true });
rateLimitSchema.index({ blockedUntil: 1 });

// Instance methods
rateLimitSchema.methods.isBlocked = function() {
  return this.blockedUntil && new Date() < this.blockedUntil;
};

rateLimitSchema.methods.incrementFailedAttempts = async function() {
  this.failedAttempts += 1;
  
  // Block for 15 minutes after 5 failed attempts
  if (this.failedAttempts >= 5) {
    this.blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  return await this.save();
};

rateLimitSchema.methods.reset = async function() {
  this.failedAttempts = 0;
  this.blockedUntil = null;
  return await this.save();
};

// Static methods
rateLimitSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    blockedUntil: {
      $lt: new Date()
    }
  });
  return result.deletedCount;
};

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

export default RateLimit; 