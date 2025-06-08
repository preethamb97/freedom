/**
 * Mock Authentication Service for Testing
 * 
 * This mock service simulates the authentication flow without requiring
 * real Google Firebase credentials or external API calls.
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Mock user database for testing
const mockUsers = new Map();

/**
 * Generate a test ObjectId
 */
function generateTestObjectId() {
  return new mongoose.Types.ObjectId();
}

/**
 * Mock Google token verification
 */
export async function authenticateWithGoogle(token) {
  // Simulate token validation
  if (!token || token === 'invalid-token') {
    throw new Error('Invalid Google token');
  }
  
  // Mock successful authentication
  const mockGoogleUser = {
    uid: `google_${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    email_verified: true
  };
  
  // Check if user exists or create new one
  let user = Array.from(mockUsers.values()).find(u => u.email === mockGoogleUser.email);
  
  if (!user) {
    const userId = generateTestObjectId();
    user = {
      user_id: userId,
      google_id: mockGoogleUser.uid,
      email: mockGoogleUser.email,
      name: mockGoogleUser.name,
      photo: mockGoogleUser.picture,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockUsers.set(userId.toString(), user);
  }
  
  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'test-secret';
  const token_jwt = jwt.sign(
    {
      user_id: user.user_id.toString(),
      email: user.email,
      google_id: user.google_id,
      name: user.name
    },
    jwtSecret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'encrypted-data-ui',
      audience: 'encrypted-data-ui-users'
    }
  );
  
  return {
    user,
    token: token_jwt
  };
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  const user = mockUsers.get(userId.toString());
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updateData) {
  const user = mockUsers.get(userId.toString());
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update user data
  const updatedUser = {
    ...user,
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  mockUsers.set(userId.toString(), updatedUser);
  
  return updatedUser;
}

/**
 * Clear all mock users (for test cleanup)
 */
export function clearMockUsers() {
  mockUsers.clear();
}

/**
 * Get all mock users (for debugging)
 */
export function getMockUsers() {
  return Array.from(mockUsers.values());
} 