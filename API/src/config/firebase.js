import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      let credential;
      
      // Try to load from google_services.json file first
      const serviceAccountPath = path.join(process.cwd(), 'google_services.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        console.log('Loading Firebase config from google_services.json');
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        credential = admin.credential.cert(serviceAccount);
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log('Loading Firebase config from environment variable');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
      } else {
        console.log('Loading Firebase config from default credentials');
        // Initialize with default credentials (development)
        credential = admin.credential.applicationDefault();
      }
      
      admin.initializeApp({
        credential: credential,
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    throw error;
  }
};

// Verify Firebase ID token
export const verifyFirebaseToken = async (idToken) => {
  try {
    const firebaseAdmin = initializeFirebase();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error('Invalid Firebase token');
  }
};

export default initializeFirebase; 