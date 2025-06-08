import jwt from 'jsonwebtoken';
import { sendAuthError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
export const generateToken = (user) => {
  try {
    const payload = {
      user_id: user.user_id,
      google_id: user.google_id,
      email: user.email,
      name: user.name
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'encrypted-data-ui',
      audience: 'encrypted-data-ui-users'
    });

    logger.debug('JWT token generated successfully', { userId: user.user_id });
    return token;
  } catch (error) {
    logger.errorWithStack('Failed to generate JWT token', error, { userId: user.user_id });
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'encrypted-data-ui',
      audience: 'encrypted-data-ui-users'
    });
    
    logger.debug('JWT token verified successfully', { userId: decoded.user_id });
    return decoded;
  } catch (error) {
    logger.warn('JWT verification failed', { error: error.message });
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Authenticate request and return Response object on error, null on success
 */
export const authenticateRequest = (req) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      logger.warn('Authentication failed: No token provided', { 
        url: req.url, 
        method: req.method 
      });
      return sendAuthError('Access token required');
    }
    
    const decoded = verifyToken(token);
    req.user = decoded;
    
    logger.debug('Request authenticated successfully', { 
      userId: decoded.user_id,
      url: req.url,
      method: req.method
    });
    
    return null; // Success, no error response
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error.message,
      url: req.url, 
      method: req.method 
    });
    return sendAuthError('Invalid or expired token');
  }
};

/**
 * Legacy Express-style middleware for backwards compatibility
 * DO NOT USE - Use authenticateRequest instead
 */
export const authenticateToken = (req, res, next) => {
  const authResult = authenticateRequest(req);
  if (authResult) {
    // Return the error response
    return authResult;
  }
  // Success - call next
  next();
  return null;
}; 