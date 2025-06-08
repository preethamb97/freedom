/**
 * Test Setup Script
 * 
 * This script sets up the test environment, initializes test database,
 * and provides helper functions for integration tests.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { createTestDbConnection, closeTestDbConnection, clearTestDatabase } from './testConfig.js';

// Test configuration
const TEST_CONFIG = {
  MONGODB_URI: 'mongodb://localhost:27017/encrypted_data_app_test',
  DB_NAME: 'encrypted_data_app_test',
  JWT_SECRET: 'test-super-secret-jwt-key-for-testing-only-not-for-production-use',
  JWT_EXPIRES_IN: '1h',
  FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
    type: "service_account",
    project_id: "test-project",
    private_key_id: "test-key-id",
    private_key: "-----BEGIN PRIVATE KEY-----\nMOCK_TEST_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
    client_email: "test@test-project.iam.gserviceaccount.com",
    client_id: "test-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com"
  }),
  PORT: '3001',
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:3000',
  CORS_ORIGIN: '*',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX_ATTEMPTS: '100',
  LOG_LEVEL: 'error',
  ENABLE_TEST_ROUTES: 'true',
  MOCK_GOOGLE_AUTH: 'true',
  SKIP_FIREBASE_INIT: 'true',
  ENABLE_DATABASE: 'true'
};

/**
 * Create test environment file
 */
function createTestEnv() {
  const envContent = Object.entries(TEST_CONFIG)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  writeFileSync('.env.test', envContent);
  console.log('✅ Created .env.test file');
}

/**
 * Initialize test database
 */
async function initTestDatabase() {
  try {
    console.log('🗄️ Setting up test MongoDB database...');
    
    // Connect to test database
    const connection = await createTestDbConnection();
    
    if (connection) {
      console.log('✅ Test database connection established');
      
      // Clear any existing test data
      await clearTestDatabase();
      console.log('✅ Test database cleared');
      
      // Close connection
      await closeTestDbConnection();
    } else {
      console.warn('⚠️ Could not establish test database connection');
    }

  } catch (error) {
    console.warn('⚠️ Database setup failed:', error.message);
    console.log('📝 Please ensure MongoDB is running and accessible');
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Connect to test database
    const connection = await createTestDbConnection();
    
    if (connection) {
      // Clear all collections
      await clearTestDatabase();
      
      // Close connection
      await closeTestDbConnection();
      
      console.log('✅ Test data cleaned up');
    } else {
      console.warn('⚠️ Could not connect to database for cleanup');
    }
  } catch (error) {
    console.warn('⚠️ Could not cleanup test data:', error.message);
  }
}

/**
 * Check if dependencies are available
 */
function checkDependencies() {
  console.log('🔍 Checking test dependencies...');
  
  const requiredCommands = ['mongosh', 'node', 'bun'];
  
  for (const cmd of requiredCommands) {
    try {
      execSync(`which ${cmd}`, { stdio: 'pipe' });
      console.log(`✅ ${cmd} is available`);
    } catch (error) {
      if (cmd === 'mongosh') {
        console.warn(`⚠️ ${cmd} is not available (MongoDB shell not found)`);
      } else {
        console.warn(`⚠️ ${cmd} is not available`);
      }
    }
  }
  
  // Check if MongoDB is running
  try {
    execSync('mongosh --eval "db.version()" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running');
  } catch (error) {
    console.warn('⚠️ MongoDB may not be running locally');
    console.log('📝 Note: Tests will use MongoDB Atlas if MONGODB_URI is configured');
  }
}

/**
 * Start test server
 */
function startTestServer() {
  console.log('🚀 Starting test server...');
  
  // Set test environment
  process.env = { ...process.env, ...TEST_CONFIG };
  
  // Start server in background
  try {
    const serverProcess = execSync('bun run --env-file=.env.test src/server.js &', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log('✅ Test server started');
    return serverProcess;
  } catch (error) {
    console.error('❌ Failed to start test server:', error.message);
    throw error;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(port = 3001, maxAttempts = 10) {
  console.log(`⏳ Waiting for server on port ${port}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        console.log('✅ Server is ready');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Server did not become ready in time');
}

/**
 * Main setup function
 */
export async function setupTests() {
  console.log('🧪 Setting up integration tests...');
  
  checkDependencies();
  createTestEnv();
  await initTestDatabase();
  
  console.log('✅ Test setup completed');
}

/**
 * Main teardown function
 */
export async function teardownTests() {
  console.log('🧹 Tearing down tests...');
  
  await cleanupTestData();
  
  console.log('✅ Test teardown completed');
}

// Export helper functions
export {
  createTestEnv,
  initTestDatabase,
  cleanupTestData,
  checkDependencies,
  startTestServer,
  waitForServer,
  TEST_CONFIG
};

// If run directly, perform setup
if (import.meta.main) {
  setupTests().catch(console.error);
} 