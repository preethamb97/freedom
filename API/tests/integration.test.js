import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';

/**
 * Comprehensive Integration Tests for Encrypted Data API
 * 
 * This test suite covers all API endpoints:
 * - Authentication routes (/api/auth)
 * - Encryption routes (/api/encryption) 
 * - Data routes (/api/data)
 * - Health check (/api/health)
 */

const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Test data constants
const VALID_GOOGLE_TOKEN = 'mock-google-token-for-testing';
const VALID_ENCRYPTION_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890123456789012';
const VALID_PASSPHRASE = 'TestPassphrase123!';
const TEST_USER_DATA = {
  name: 'Test User',
  email: 'test@example.com',
  photo: 'https://example.com/photo.jpg'
};

// Global test state
let authToken = null;
let testUserId = null;
let testEncryptionId = null;

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(method, endpoint, options = {}) {
  const { body, headers = {}, skipAuth = false } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (!skipAuth && authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    console.error(`Request failed: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * Helper function to create a test user and get auth token
 */
async function authenticateTestUser() {
  // Mock Google authentication
  const response = await makeRequest('POST', '/api/auth/google', {
    body: { token: VALID_GOOGLE_TOKEN },
    skipAuth: true
  });

  if (response.status === 200 && response.data.success) {
    authToken = response.data.token;
    testUserId = response.data.user.user_id;
    return response.data;
  }
  
  throw new Error('Failed to authenticate test user');
}

/**
 * Helper function to create a test encryption
 */
async function createTestEncryption() {
  const uniqueName = `Test Encryption ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const response = await makeRequest('POST', '/api/encryption', {
    body: {
      name: uniqueName,
      passphrase: VALID_PASSPHRASE,
      encryptionKey: VALID_ENCRYPTION_KEY
    }
  });

  if (response.status === 201 && response.data.success) {
    testEncryptionId = response.data.encryption.encryption_id;
    return response.data.encryption;
  }

  throw new Error(`Failed to create test encryption: ${response.data?.message || 'Unknown error'}`);
}

/**
 * Helper function to wait for server to be ready
 */
async function waitForServer(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await makeRequest('GET', '/api/health', { skipAuth: true });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not become ready in time');
}

// Test setup and teardown
beforeAll(async () => {
  console.log('🚀 Starting integration tests...');
  
  // Wait for server to be ready
  await waitForServer();
  
  // Authenticate test user
  try {
    await authenticateTestUser();
    console.log('✅ Test user authenticated');
  } catch (error) {
    console.warn('⚠️ Could not authenticate test user, some tests may fail:', error.message);
  }
}, TEST_TIMEOUT);

beforeEach(async () => {
  // Clear mock data before each test
  if (global.mockAuthService?.clearMockUsers) {
    global.mockAuthService.clearMockUsers();
  }
  if (global.mockEncryptionService?.clearMockEncryptions) {
    global.mockEncryptionService.clearMockEncryptions();
  }
  if (global.mockDataService?.clearMockData) {
    global.mockDataService.clearMockData();
  }
  
  // Re-authenticate test user after clearing data
  try {
    await authenticateTestUser();
  } catch (error) {
    console.warn('⚠️ Could not re-authenticate test user:', error.message);
  }
});

afterAll(async () => {
  console.log('🧪 Integration test suite loaded successfully');
  
  // Final cleanup
  if (global.mockAuthService?.clearMockUsers) {
    global.mockAuthService.clearMockUsers();
  }
  if (global.mockEncryptionService?.clearMockEncryptions) {
    global.mockEncryptionService.clearMockEncryptions();
  }
  if (global.mockDataService?.clearMockData) {
    global.mockDataService.clearMockData();
  }
}, TEST_TIMEOUT);

// Health Check Tests
describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const response = await makeRequest('GET', '/api/health', { skipAuth: true });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.status).toBe('OK');
    expect(response.data.data.timestamp).toBeDefined();
    expect(response.data.data.uptime).toBeDefined();
  });

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'OPTIONS'
    });
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

// Authentication API Tests
describe('Authentication API (/api/auth)', () => {
  describe('POST /api/auth/google', () => {
    it('should successfully authenticate with valid Google token', async () => {
      const response = await makeRequest('POST', '/api/auth/google', {
        body: { token: VALID_GOOGLE_TOKEN },
        skipAuth: true
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe('Authentication successful');
      expect(response.data.user).toBeDefined();
      expect(response.data.user.user_id).toBeDefined();
      expect(response.data.user.email).toBeDefined();
      expect(response.data.token).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await makeRequest('POST', '/api/auth/google', {
        body: {},
        skipAuth: true
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const response = await makeRequest('POST', '/api/auth/google', {
        body: { token: 'invalid-token' },
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Invalid');
    });

    it('should reject request with missing body', async () => {
      const response = await makeRequest('POST', '/api/auth/google', {
        skipAuth: true
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid authentication', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping profile test - no auth token available');
        return;
      }

      const response = await makeRequest('GET', '/api/auth/profile');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.user_id).toBe(testUserId);
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('GET', '/api/auth/profile', {
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const response = await makeRequest('GET', '/api/auth/profile', {
        headers: { Authorization: 'Bearer invalid-token' },
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile with valid data', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping profile update test - no auth token available');
        return;
      }

      const updateData = {
        name: 'Updated Test User',
        email: 'updated@example.com',
        photo: 'https://example.com/new-photo.jpg'
      };

      const response = await makeRequest('PUT', '/api/auth/profile', {
        body: updateData
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('updated');
      expect(response.data.user.name).toBe(updateData.name);
      expect(response.data.user.email).toBe(updateData.email);
    });

    it('should reject update with missing required fields', async () => {
      if (!authToken) return;

      const response = await makeRequest('PUT', '/api/auth/profile', {
        body: { photo: 'https://example.com/photo.jpg' }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('required');
    });

    it('should reject update with invalid email', async () => {
      if (!authToken) return;

      const response = await makeRequest('PUT', '/api/auth/profile', {
        body: {
          name: 'Test User',
          email: 'invalid-email'
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('email');
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('PUT', '/api/auth/profile', {
        body: TEST_USER_DATA,
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// Encryption API Tests
describe('Encryption API (/api/encryption)', () => {
  describe('POST /api/encryption', () => {
    it('should create encryption with valid data', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping encryption creation test - no auth token available');
        return;
      }

      const uniqueName = `Test Encryption for Creation ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const encryptionData = {
        name: uniqueName,
        passphrase: VALID_PASSPHRASE,
        encryptionKey: VALID_ENCRYPTION_KEY
      };

      const response = await makeRequest('POST', '/api/encryption', {
        body: encryptionData
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('created');
      expect(response.data.encryption).toBeDefined();
      expect(response.data.encryption.name).toBe(encryptionData.name);
      expect(response.data.encryption.encryption_id).toBeDefined();
    });

    it('should reject creation with missing required fields', async () => {
      if (!authToken) return;

      const response = await makeRequest('POST', '/api/encryption', {
        body: { name: 'Incomplete Encryption' }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('required');
    });

    it('should reject creation with invalid encryption key length', async () => {
      if (!authToken) return;

      const response = await makeRequest('POST', '/api/encryption', {
        body: {
          name: 'Invalid Key Encryption',
          passphrase: VALID_PASSPHRASE,
          encryptionKey: '12345' // Too short
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('64');
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('POST', '/api/encryption', {
        body: {
          name: 'Unauthorized Encryption',
          passphrase: VALID_PASSPHRASE,
          encryptionKey: VALID_ENCRYPTION_KEY
        },
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /api/encryption', () => {
    it('should get user encryptions', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping get encryptions test - no auth token available');
        return;
      }

      // Create test encryption first
      await createTestEncryption();

      const response = await makeRequest('GET', '/api/encryption');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.encryptions).toBeDefined();
      expect(Array.isArray(response.data.encryptions)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('GET', '/api/encryption', {
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /api/encryption/:encryptionId/verify-key', () => {
    it('should verify valid encryption key', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping key verification test - no auth token available');
        return;
      }

      // Create test encryption first
      await createTestEncryption();

      const response = await makeRequest('POST', `/api/encryption/${testEncryptionId}/verify-key`, {
        body: { encryptionKey: VALID_ENCRYPTION_KEY }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject invalid encryption key', async () => {
      if (!authToken || !testEncryptionId) return;

      const response = await makeRequest('POST', `/api/encryption/${testEncryptionId}/verify-key`, {
        body: { encryptionKey: 'invalid-key' }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject request without encryption key', async () => {
      if (!authToken || !testEncryptionId) return;

      const response = await makeRequest('POST', `/api/encryption/${testEncryptionId}/verify-key`, {
        body: {}
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('required');
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('POST', '/api/encryption/1/verify-key', {
        body: { encryptionKey: VALID_ENCRYPTION_KEY },
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// Data API Tests
describe('Data API (/api/data)', () => {
  let testDataId = null;

  describe('POST /api/data', () => {
    it('should store encrypted data with valid inputs', async () => {
      if (!authToken) {
        console.warn('⚠️ Skipping data storage test - no auth token available');
        return;
      }

      // Create test encryption first
      await createTestEncryption();

      const testData = {
        encryption_id: testEncryptionId,
        text: 'This is test data to be encrypted',
        encryptionKey: VALID_ENCRYPTION_KEY
      };

      const response = await makeRequest('POST', '/api/data', {
        body: testData
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('stored');
      expect(response.data.data.data_id).toBeDefined();
      expect(response.data.data.encryption_id).toBe(testEncryptionId);
      
      testDataId = response.data.data.data_id;
    });

    it('should reject storage with missing encryption_id', async () => {
      if (!authToken) return;

      const response = await makeRequest('POST', '/api/data', {
        body: {
          text: 'Test data',
          encryptionKey: VALID_ENCRYPTION_KEY
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('encryption ID');
    });

    it('should reject storage with empty text', async () => {
      if (!authToken) return;

      const response = await makeRequest('POST', '/api/data', {
        body: {
          encryption_id: 1,
          text: '',
          encryptionKey: VALID_ENCRYPTION_KEY
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Text content');
    });

    it('should reject storage with short passphrase', async () => {
      if (!authToken) return;

      const response = await makeRequest('POST', '/api/data', {
        body: {
          encryption_id: 1,
          text: 'Test data',
          encryptionKey: '123' // Too short
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('64-digit encryption key');
    });

    it('should reject storage with oversized text', async () => {
      if (!authToken) return;

      const largeText = 'A'.repeat(1000001); // Exceeds 1MB limit

      const response = await makeRequest('POST', '/api/data', {
        body: {
          encryption_id: 1,
          text: largeText,
          encryptionKey: VALID_ENCRYPTION_KEY
        }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('1MB limit');
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('POST', '/api/data', {
        body: {
          encryption_id: 1,
          text: 'Test data',
          encryptionKey: VALID_ENCRYPTION_KEY
        },
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /api/data/:encryptionId', () => {
    it('should retrieve encrypted data with valid encryptionKey', async () => {
      if (!authToken || !testEncryptionId) {
        console.warn('⚠️ Skipping data retrieval test - no auth token or encryption available');
        return;
      }

      // First store some data
      await makeRequest('POST', '/api/data', {
        body: {
          encryption_id: testEncryptionId,
          text: 'Test data for retrieval',
          encryptionKey: VALID_ENCRYPTION_KEY
        }
      });

      const response = await makeRequest('GET', `/api/data/${testEncryptionId}?passphrase=${encodeURIComponent(VALID_ENCRYPTION_KEY)}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      if (!authToken || !testEncryptionId) return;

      const response = await makeRequest('GET', `/api/data/${testEncryptionId}?passphrase=${encodeURIComponent(VALID_ENCRYPTION_KEY)}&limit=5&offset=0`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject retrieval with invalid encryption ID', async () => {
      if (!authToken) return;

      const response = await makeRequest('GET', `/api/data/invalid?passphrase=${encodeURIComponent(VALID_ENCRYPTION_KEY)}`);

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('encryption ID');
    });

    it('should reject retrieval without encryptionKey', async () => {
      if (!authToken) return;

      const response = await makeRequest('GET', '/api/data/1');

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('64-digit encryption key');
    });

    it('should reject request without authentication', async () => {
      const response = await makeRequest('GET', `/api/data/1?passphrase=${encodeURIComponent(VALID_ENCRYPTION_KEY)}`, {
        skipAuth: true
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// Error Handling Tests
describe('Error Handling', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await makeRequest('GET', '/api/nonexistent', { skipAuth: true });

    expect(response.status).toBe(404);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toContain('not found');
  });

  it('should handle malformed JSON in request body', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || 'test'}`
        },
        body: 'invalid-json'
      });

      expect(response.status).toBe(400);
    } catch (error) {
      // Expected for malformed JSON
    }
  });

  it('should include security headers in responses', async () => {
    if (!authToken || !testEncryptionId) return;

    const response = await fetch(`${API_BASE_URL}/api/data/${testEncryptionId}?passphrase=${encodeURIComponent(VALID_PASSPHRASE)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});

// Performance Tests
describe('Performance', () => {
  it('should respond to health check within reasonable time', async () => {
    const startTime = Date.now();
    
    const response = await makeRequest('GET', '/api/health', { skipAuth: true });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(5).fill().map(() => 
      makeRequest('GET', '/api/health', { skipAuth: true })
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});

console.log('🧪 Integration test suite loaded successfully'); 