/**
 * Test Configuration
 * 
 * This file manages test-specific configurations, mocks, and overrides
 * to enable testing without external dependencies.
 */
import mongoose from 'mongoose';

/**
 * Enable test mocks based on environment variables
 */
export function setupTestMocks() {
  // Mock Google Authentication if enabled
  if (process.env.MOCK_GOOGLE_AUTH === 'true') {
    console.log('🔧 Enabling Google Auth mocks...');
    
    // Mock the auth service import
    const originalImport = global.require || require;
    
    // Intercept auth service imports
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id) {
      if (id.includes('authService') && process.env.NODE_ENV === 'test') {
        return originalRequire.call(this, '../tests/mocks/authService.js');
      }
      return originalRequire.call(this, id);
    };
  }
  
  // Mock Firebase if enabled
  if (process.env.SKIP_FIREBASE_INIT === 'true') {
    console.log('🔧 Skipping Firebase initialization...');
    
    // Mock Firebase admin
    global.mockFirebase = {
      auth: () => ({
        verifyIdToken: async (token) => {
          if (token === 'mock-google-token-for-testing') {
            return {
              uid: 'test-user-uid',
              email: 'test@example.com',
              name: 'Test User',
              picture: 'https://example.com/avatar.jpg'
            };
          }
          throw new Error('Invalid token');
        }
      })
    };
  }
}

/**
 * Test database configuration for MongoDB
 */
export const testDbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/encrypted_data_app_test',
  dbName: process.env.DB_NAME || 'encrypted_data_app_test',
  options: {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false // Disable mongoose buffering for tests
  }
};

/**
 * Test-specific overrides
 */
export const testOverrides = {
  // Disable rate limiting for tests
  rateLimitEnabled: false,
  
  // Reduce encryption complexity for faster tests
  encryptionRounds: 1,
  
  // Enable detailed logging for debugging
  logLevel: process.env.LOG_LEVEL || 'error',
  
  // Test-specific JWT settings
  jwtSecret: process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing-only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Setup mocks
  setupTestMocks();
  
  // Override console methods for cleaner test output
  if (process.env.LOG_LEVEL === 'error') {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      if (args[0] && args[0].includes('🧪')) {
        originalLog(...args);
      }
    };
    
    console.info = () => {}; // Suppress info logs
    console.warn = (...args) => {
      if (args[0] && args[0].includes('⚠️')) {
        originalWarn(...args);
      }
    };
  }
  
  console.log('🔧 Test environment configured');
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
  // Clear test-specific globals
  delete global.mockFirebase;
  
  // Reset console methods
  // Note: This is simplified - in production, you might want to restore original methods
  
  console.log('🧹 Test environment cleaned up');
}

/**
 * Create test database connection
 */
export async function createTestDbConnection() {
  try {
    await mongoose.connect(testDbConfig.uri, testDbConfig.options);
    console.log('✅ Connected to test MongoDB database');
    return mongoose.connection;
  } catch (error) {
    console.warn('⚠️ Could not create test database connection:', error.message);
    return null;
  }
}

/**
 * Close test database connection
 */
export async function closeTestDbConnection() {
  try {
    await mongoose.connection.close();
    console.log('✅ Closed test MongoDB connection');
  } catch (error) {
    console.warn('⚠️ Error closing test database connection:', error.message);
  }
}

/**
 * Clear test database collections
 */
export async function clearTestDatabase() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
    }
    
    console.log('✅ Cleared test database collections');
  } catch (error) {
    console.warn('⚠️ Error clearing test database:', error.message);
  }
}

/**
 * Test data factories
 */
export const testData = {
  validUser: {
    name: 'Test User',
    email: 'test@example.com',
    photo: 'https://example.com/avatar.jpg'
  },
  
  validEncryption: {
    name: 'Test Encryption',
    passphrase: 'TestPassphrase123!',
    encryptionKey: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012'
  },
  
  validData: {
    text: 'This is test data to be encrypted and stored',
    passphrase: 'TestPassphrase123!'
  },
  
  invalidInputs: {
    shortPassphrase: '123',
    shortEncryptionKey: '12345',
    emptyText: '',
    invalidEmail: 'not-an-email'
  }
};

/**
 * Test utility functions
 */
export const testUtils = {
  /**
   * Generate random test data
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  /**
   * Generate valid encryption key for testing
   */
  generateTestEncryptionKey: () => {
    return 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012';
  },
  
  /**
   * Sleep utility for tests
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Wait for condition with timeout
   */
  waitFor: async (condition, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await testUtils.sleep(100);
    }
    throw new Error('Condition not met within timeout');
  }
};

// Auto-setup if this file is imported in test environment
if (process.env.NODE_ENV === 'test') {
  setupTestEnvironment();
} 