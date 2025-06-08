import { RateLimit } from '../models/index.js';

const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION_MINUTES = 15;

/**
 * Check if IP is rate limited for specific encryption
 */
export const checkRateLimit = async (ipAddress, encryptionId) => {
  try {
    const record = await RateLimit.findOne({
      ipAddress: ipAddress,
      encryptionId: encryptionId
    });
    
    if (!record) {
      return { isBlocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }
    
    const now = new Date();
    
    // Check if still blocked
    if (record.blockedUntil && new Date(record.blockedUntil) > now) {
      const unblockTime = new Date(record.blockedUntil);
      const minutesRemaining = Math.ceil((unblockTime - now) / (1000 * 60));
      
      return {
        isBlocked: true,
        minutesRemaining,
        message: `Too many failed attempts. Try again in ${minutesRemaining} minutes.`
      };
    }
    
    // Reset if block period has expired
    if (record.blockedUntil && new Date(record.blockedUntil) <= now) {
      await record.reset();
      return { isBlocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }
    
    const remainingAttempts = MAX_FAILED_ATTEMPTS - record.failedAttempts;
    
    return {
      isBlocked: false,
      remainingAttempts: Math.max(0, remainingAttempts)
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error.message);
    throw error;
  }
};

/**
 * Record failed attempt
 */
export const recordFailedAttempt = async (ipAddress, encryptionId) => {
  try {
    let record = await RateLimit.findOne({
      ipAddress: ipAddress,
      encryptionId: encryptionId
    });
    
    if (!record) {
      record = new RateLimit({
        ipAddress: ipAddress,
        encryptionId: encryptionId,
        failedAttempts: 1
      });
      await record.save();
    } else {
      await record.incrementFailedAttempts();
    }
    
    const remainingAttempts = MAX_FAILED_ATTEMPTS - record.failedAttempts;
    
    if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        blocked: true,
        message: `Too many failed attempts. Access blocked for ${BLOCK_DURATION_MINUTES} minutes.`
      };
    }
    
    return {
      blocked: false,
      remainingAttempts: Math.max(0, remainingAttempts),
      message: `Invalid encryption key. ${remainingAttempts} attempts remaining.`
    };
    
  } catch (error) {
    console.error('Failed to record failed attempt:', error.message);
    throw error;
  }
};

/**
 * Reset failed attempts on successful authentication
 */
export const resetFailedAttempts = async (ipAddress, encryptionId) => {
  try {
    const record = await RateLimit.findOne({
      ipAddress: ipAddress,
      encryptionId: encryptionId
    });
    
    if (record) {
      await RateLimit.deleteOne({ _id: record._id });
    }
  } catch (error) {
    console.error('Failed to reset failed attempts:', error.message);
    // Don't throw error as this is not critical
  }
};

/**
 * Clean up expired rate limit records (should be run periodically)
 */
export const cleanupExpiredRecords = async () => {
  try {
    const deletedCount = await RateLimit.cleanupExpired();
    
    if (deletedCount > 0) {
      console.log(`[RATE_LIMITER] Cleaned up ${deletedCount} expired rate limit records`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup expired records:', error.message);
    return 0;
  }
};

/**
 * Get client IP address from request
 */
export const getClientIP = (req) => {
  // Handle different request object structures
  const headers = req.headers || {};
  const connection = req.connection || {};
  const socket = req.socket || {};
  
  return headers['x-forwarded-for'] || 
         headers['x-real-ip'] || 
         headers['cf-connecting-ip'] ||
         connection.remoteAddress ||
         socket.remoteAddress ||
         (req.ip && req.ip !== '::1' ? req.ip : null) ||
         '127.0.0.1'; // Default fallback for local development
};

/**
 * Get rate limit status for multiple encryptions
 */
export const getBulkRateLimit = async (ipAddress, encryptionIds) => {
  try {
    const records = await RateLimit.find({
      ipAddress: ipAddress,
      encryptionId: { $in: encryptionIds }
    });
    
    const results = {};
    const now = new Date();
    
    for (const encryptionId of encryptionIds) {
      const record = records.find(r => r.encryptionId.toString() === encryptionId.toString());
      
      if (!record) {
        results[encryptionId] = { isBlocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
        continue;
      }
      
      if (record.blockedUntil && new Date(record.blockedUntil) > now) {
        const unblockTime = new Date(record.blockedUntil);
        const minutesRemaining = Math.ceil((unblockTime - now) / (1000 * 60));
        
        results[encryptionId] = {
          isBlocked: true,
          minutesRemaining,
          message: `Too many failed attempts. Try again in ${minutesRemaining} minutes.`
        };
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - record.failedAttempts;
        results[encryptionId] = {
          isBlocked: false,
          remainingAttempts: Math.max(0, remainingAttempts)
        };
      }
    }
    
    return results;
  } catch (error) {
    console.error('Bulk rate limit check failed:', error.message);
    throw error;
  }
}; 