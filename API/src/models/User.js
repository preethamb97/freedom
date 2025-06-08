import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  photo: {
    type: String,
    maxlength: 500,
    default: null
  }
}, {
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: function(doc, ret) {
      ret.user_id = ret._id;
      ret.google_id = ret.googleId;
      ret.created_at = ret.createdAt;
      ret.updated_at = ret.updatedAt;
      delete ret._id;
      delete ret.__v;
      delete ret.googleId;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ googleId: 1 }, { unique: true });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User; 