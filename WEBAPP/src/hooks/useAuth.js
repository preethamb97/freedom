import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithGooglePopup, signOutUser, trackUserEvent, setAnalyticsUserId, setAnalyticsUserProperties } from '../services/firebase';
import { authAPI } from '../services/api';
import { notification } from 'antd';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Track returning user
          trackUserEvent('user_session_restored', {
            user_id: parsedUser.id,
            user_email: parsedUser.email,
            session_type: 'returning'
          });
          
          // Set analytics user properties
          setAnalyticsUserId(parsedUser.id);
          setAnalyticsUserProperties({
            user_type: 'returning',
            security_focused: true,
            encryption_user: true
          });
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Track auth error
        trackUserEvent('auth_error', {
          error_type: 'session_restore_failed',
          error_message: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  const signIn = useCallback(async () => {
    try {
      setLoading(true);
      
      // Track sign-in attempt
      trackUserEvent('sign_in_attempt', {
        auth_method: 'google_oauth',
        timestamp: new Date().toISOString()
      });
      
      // Sign in with Google
      const firebaseResult = await signInWithGooglePopup();
      const firebaseUser = firebaseResult.user;
      
      // Get Firebase ID token
      const token = await firebaseUser.getIdToken();
      
      // Authenticate with our API
      const response = await authAPI.googleLogin(token);
      const { user: apiUser, token: jwtToken } = response.data;
      
      // Store user and token
      localStorage.setItem('user', JSON.stringify(apiUser));
      localStorage.setItem('token', jwtToken);
      
      setUser(apiUser);
      
      // Track successful sign-in
      trackUserEvent('sign_in_success', {
        user_id: apiUser.id,
        user_email: apiUser.email,
        auth_method: 'google_oauth',
        is_new_user: !apiUser.lastLoginAt,
        timestamp: new Date().toISOString()
      });
      
      // Set analytics user properties
      setAnalyticsUserId(apiUser.id);
      setAnalyticsUserProperties({
        user_type: apiUser.lastLoginAt ? 'returning' : 'new',
        security_focused: true,
        encryption_user: true,
        signup_date: apiUser.createdAt
      });
      
      notification.success({
        message: 'Login Successful',
        description: `Welcome, ${apiUser.name}!`,
        duration: 3,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Track sign-in error
      trackUserEvent('sign_in_error', {
        error_type: 'authentication_failed',
        error_message: error.message,
        auth_method: 'google_oauth',
        timestamp: new Date().toISOString()
      });
      
      // Clean up Firebase auth if API fails
      try {
        await signOutUser();
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      
      notification.error({
        message: 'Login Failed',
        description: 'Failed to authenticate with server',
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      const currentUser = user;
      
      // Track sign-out attempt
      trackUserEvent('sign_out_attempt', {
        user_id: currentUser?.id,
        timestamp: new Date().toISOString()
      });
      
      // Sign out from Firebase
      await signOutUser();
      
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Clear user state
      setUser(null);
      
      // Track successful sign-out
      trackUserEvent('sign_out_success', {
        user_id: currentUser?.id,
        session_duration: currentUser?.sessionStart ? 
          Date.now() - new Date(currentUser.sessionStart).getTime() : null,
        timestamp: new Date().toISOString()
      });
      
      // Clear analytics user
      setAnalyticsUserId(null);
      
      notification.success({
        message: 'Signed Out',
        description: 'You have been successfully signed out',
        duration: 3,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      
      // Track sign-out error
      trackUserEvent('sign_out_error', {
        error_type: 'signout_failed',
        error_message: error.message,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
      
      notification.error({
        message: 'Sign Out Failed',
        description: 'Error during sign out',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 