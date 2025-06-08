import { 
  sendSuccess, 
  sendError, 
  sendValidationError, 
  sendAuthError, 
  sendNotFoundError, 
  sendServerError 
} from '../utils/response.js';
import { logger } from '../utils/logger.js';

// Dynamic import for auth service to support mocking
async function getAuthService() {
  if (process.env.NODE_ENV === 'test' && global.mockAuthService) {
    return global.mockAuthService;
  }
  return await import('../services/authService.js');
}

/**
 * Google login endpoint
 */
export const googleLogin = async (req, res) => {
  try {
    logger.info('Google login attempt', { 
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-real-ip'] || 'unknown' 
    });

    const { token } = req.body;
    
    if (!token) {
      logger.warn('Google login failed: No token provided');
      return sendValidationError('Google token is required');
    }
    
    const authService = await getAuthService();
    const result = await authService.authenticateWithGoogle(token);
    
    logger.info('Google login successful', { 
      userId: result.user.user_id,
      email: result.user.email 
    });

    return sendSuccess({
      message: 'Authentication successful',
      user: result.user,
      token: result.token
    });
    
  } catch (error) {
    logger.errorWithStack('Google login error', error, { 
      hasToken: !!req.body?.token 
    });
    
    if (error.message.includes('Invalid') || error.message.includes('token')) {
      return sendAuthError('Invalid Google token');
    }
    
    return sendServerError('Authentication failed');
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      logger.warn('Get profile failed: No user ID in request');
      return sendAuthError('User authentication required');
    }

    logger.debug('Getting user profile', { userId });
    
    const authService = await getAuthService();
    const profile = await authService.getUserProfile(userId);
    
    logger.info('User profile retrieved successfully', { userId });

    return sendSuccess({
      user: profile
    });
    
  } catch (error) {
    logger.errorWithStack('Get profile error', error, { 
      userId: req.user?.user_id 
    });
    
    if (error.message === 'User not found') {
      return sendNotFoundError('User not found');
    }
    
    return sendServerError('Failed to get user profile');
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      logger.warn('Update profile failed: No user ID in request');
      return sendAuthError('User authentication required');
    }

    const { name, email, photo } = req.body;
    
    logger.debug('Updating user profile', { 
      userId,
      hasName: !!name,
      hasEmail: !!email,
      hasPhoto: !!photo 
    });
    
    // Validate input
    if (!name || name.trim().length === 0) {
      logger.warn('Update profile validation failed: Missing name', { userId });
      return sendValidationError('Name is required');
    }
    
    if (!email || !email.includes('@')) {
      logger.warn('Update profile validation failed: Invalid email', { userId });
      return sendValidationError('Valid email is required');
    }
    
    const authService = await getAuthService();
    const updatedProfile = await authService.updateUserProfile(userId, {
      name: name.trim(),
      email: email.trim(),
      photo: photo || null
    });
    
    logger.info('User profile updated successfully', { 
      userId,
      name: updatedProfile.name,
      email: updatedProfile.email 
    });

    return sendSuccess({
      message: 'Profile updated successfully',
      user: updatedProfile
    });
    
  } catch (error) {
    logger.errorWithStack('Update profile error', error, { 
      userId: req.user?.user_id 
    });
    
    if (error.message === 'User not found') {
      return sendNotFoundError('User not found');
    }
    
    return sendServerError('Failed to update profile');
  }
}; 