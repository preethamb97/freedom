import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGooglePopup = () => signInWithPopup(auth, provider);
export const signOutUser = () => signOut(auth); 

// Analytics Helper Functions
export const trackEvent = (eventName, parameters = {}) => {
  try {
    logEvent(analytics, eventName, {
      timestamp: new Date().toISOString(),
      app_name: 'Freedom',
      ...parameters
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

export const trackPageView = (pageName, pageTitle, userId = null) => {
  try {
    logEvent(analytics, 'page_view', {
      page_name: pageName,
      page_title: pageTitle,
      app_name: 'Freedom',
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Page view tracking failed:', error);
  }
};

export const trackUserEvent = (eventName, properties = {}) => {
  try {
    logEvent(analytics, eventName, {
      app_name: 'Freedom',
      ...properties,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('User event tracking failed:', error);
  }
};

export const setAnalyticsUserId = (userId) => {
  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.warn('Set user ID failed:', error);
  }
};

export const setAnalyticsUserProperties = (properties) => {
  try {
    setUserProperties(analytics, {
      app_name: 'Freedom',
      ...properties
    });
  } catch (error) {
    console.warn('Set user properties failed:', error);
  }
};

// Security and Encryption Related Events
export const trackSecurityEvent = (action, details = {}) => {
  trackEvent('security_action', {
    action_type: action,
    ...details
  });
};

export const trackEncryptionEvent = (action, keyLength = null) => {
  trackEvent('encryption_action', {
    action_type: action,
    key_length: keyLength,
    encryption_type: 'AES-256-GCM'
  });
};

export const trackDataEvent = (action, dataSize = null) => {
  trackEvent('data_action', {
    action_type: action,
    data_size: dataSize
  });
}; 