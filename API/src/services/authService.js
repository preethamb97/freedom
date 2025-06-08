import { verifyFirebaseToken } from '../config/firebase.js';
import { generateToken } from '../helpers/auth.js';
import * as userRepository from '../repositories/userRepository.js';

/**
 * Authenticate user with Google token
 */
export const authenticateWithGoogle = async (googleToken) => {
  try {
    // Verify Firebase token
    const firebaseUser = await verifyFirebaseToken(googleToken);
    
    if (!firebaseUser) {
      throw new Error('Invalid Google token');
    }
    
    // Extract user data from Firebase token
    const googleUserData = {
      google_id: firebaseUser.uid,
      name: firebaseUser.name || firebaseUser.displayName || 'Anonymous',
      email: firebaseUser.email,
      photo: firebaseUser.picture || firebaseUser.photoURL
    };
    
    // Check if user exists in our database
    let user = await userRepository.findByGoogleId(googleUserData.google_id);
    
    if (!user) {
      // Create new user if doesn't exist
      user = await userRepository.create(googleUserData);
    } else {
      // Update user info if exists (in case profile changed)
      user = await userRepository.update(user.user_id, {
        name: googleUserData.name,
        email: googleUserData.email,
        photo: googleUserData.photo
      });
    }
    
    // Generate JWT token
    const jwtToken = generateToken(user);
    
    return {
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        photo: user.photo
      },
      token: jwtToken
    };
    
  } catch (error) {
    console.error('Google authentication failed:', error.message);
    throw new Error('Authentication failed');
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updateData) => {
  try {
    const updatedUser = await userRepository.update(userId, updateData);
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return {
      user_id: updatedUser.user_id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      updated_at: updatedUser.updated_at
    };
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }
}; 