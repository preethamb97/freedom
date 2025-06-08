import 'dotenv/config';
import { testConnection, initDatabase, closeConnection } from './config/database.js';
import initializeFirebase from './config/firebase.js';
import { authenticateRequest } from './helpers/auth.js';
import { 
  sendResponse, 
  sendSuccess, 
  sendError, 
  sendNotFoundError, 
  sendServerError,
  createMockResponse 
} from './utils/response.js';
import { logger } from './utils/logger.js';
import { cleanupExpiredRecords } from './helpers/rateLimiter.js';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = '*';

// Enhanced request/response wrapper
const createEnhancedRequest = async (req) => {
  const url = new URL(req.url);
  const headers = {};
  
  for (const [key, value] of req.headers) {
    headers[key] = value;
  }

  let body = {};
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (error) {
      logger.warn('Failed to parse request body', { error: error.message });
      body = {};
    }
  }

  return {
    method: req.method,
    url: url.pathname + url.search,
    pathname: url.pathname,
    searchParams: url.searchParams,
    headers,
    body,
    params: {},
    query: Object.fromEntries(url.searchParams),
    user: null
  };
};

// Route handlers
const handleAuthRoutes = async (req) => {
  try {
    const path = req.pathname.replace('/api/auth', '') || '/';
    
    if (req.method === 'POST' && path === '/google') {
      const { googleLogin } = await import('./controllers/authController.js');
      const mockRes = createMockResponse();
      const result = await googleLogin(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    } else if (req.method === 'GET' && path === '/profile') {
      const authError = authenticateRequest(req);
      if (authError) return authError;
      
      const { getProfile } = await import('./controllers/authController.js');
      const mockRes = createMockResponse();
      const result = await getProfile(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    } else if (req.method === 'PUT' && path === '/profile') {
      const authError = authenticateRequest(req);
      if (authError) return authError;
      
      const { updateProfile } = await import('./controllers/authController.js');
      const mockRes = createMockResponse();
      const result = await updateProfile(req, mockRes);
      return result || sendServerError('Controller did not return a response');
    }
    
    return sendNotFoundError('Auth route not found');
  } catch (error) {
    logger.errorWithStack('Auth route error', error, { 
      method: req.method, 
      path: req.pathname 
    });
    return sendServerError('Authentication service error');
  }
};

const handleEncryptionRoutes = async (req) => {
  try {
    const authError = authenticateRequest(req);
    if (authError) return authError;
    
    const path = req.pathname.replace('/api/encryption', '') || '/';
    const pathParts = path.split('/').filter(Boolean);
    
    if (req.method === 'POST' && path === '/') {
      const { createEncryption } = await import('./controllers/encryptionController.js');
      const mockRes = createMockResponse();
      const result = await createEncryption(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    } else if (req.method === 'GET' && path === '/') {
      const { getUserEncryptions } = await import('./controllers/encryptionController.js');
      const mockRes = createMockResponse();
      const result = await getUserEncryptions(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    } else if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'verify-key') {
      // Handle POST /api/encryption/:encryptionId/verify-key
      req.params = { encryptionId: pathParts[0] };
      const { verifyEncryptionKey } = await import('./controllers/encryptionController.js');
      const mockRes = createMockResponse();
      const result = await verifyEncryptionKey(req, mockRes);
      return result || sendServerError('Controller did not return a response');
    }
    
    return sendNotFoundError('Encryption route not found');
  } catch (error) {
    logger.errorWithStack('Encryption route error', error, { 
      method: req.method, 
      path: req.pathname 
    });
    return sendServerError('Encryption service error');
  }
};

const handleDataRoutes = async (req) => {
  try {
    const authError = authenticateRequest(req);
    if (authError) return authError;
    
    const path = req.pathname.replace('/api/data', '') || '/';
    const pathParts = path.split('/').filter(Boolean);
    
    // POST /api/data - Store encrypted data (expects encryption_id in body)
    if (req.method === 'POST' && path === '/') {
      const { storeData } = await import('./controllers/dataController.js');
      const mockRes = createMockResponse();
      const result = await storeData(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    // GET /api/data/:encryptionId - Get decrypted data (with passphrase in query)
    } else if (req.method === 'GET' && pathParts.length === 1) {
      req.params = { encryptionId: pathParts[0] };
      const { getData } = await import('./controllers/dataController.js');
      const mockRes = createMockResponse();
      const result = await getData(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    // POST /api/data/:encryptionId/decrypt - Decrypt data with key in body
    } else if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'decrypt') {
      req.params = { encryptionId: pathParts[0] };
      const { decryptData } = await import('./controllers/dataController.js');
      const mockRes = createMockResponse();
      const result = await decryptData(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    // PUT /api/data/:dataId - Update encrypted data
    } else if (req.method === 'PUT' && pathParts.length === 1) {
      req.params = { dataId: pathParts[0] };
      const { updateData } = await import('./controllers/dataController.js');
      const mockRes = createMockResponse();
      const result = await updateData(req, mockRes);
      return result || sendServerError('Controller did not return a response');
      
    // DELETE /api/data/:dataId - Delete encrypted data
    } else if (req.method === 'DELETE' && pathParts.length === 1) {
      req.params = { dataId: pathParts[0] };
      const { deleteData } = await import('./controllers/dataController.js');
      const mockRes = createMockResponse();
      const result = await deleteData(req, mockRes);
      return result || sendServerError('Controller did not return a response');
    }
    
    return sendNotFoundError('Data route not found');
  } catch (error) {
    logger.errorWithStack('Data route error', error, { 
      method: req.method, 
      path: req.pathname 
    });
    return sendServerError('Data service error');
  }
};

// Main server
const server = Bun.serve({
  port: PORT,
  async fetch(rawRequest) {
    const startTime = Date.now();
    
    try {
      // Handle CORS preflight
      if (rawRequest.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': CORS_ORIGIN,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Create enhanced request object
      const req = await createEnhancedRequest(rawRequest);
      
      // Log request
      logger.request(req, 'Incoming request');

      let response;

      // Route to appropriate handler
      if (req.pathname.startsWith('/api/auth')) {
        response = await handleAuthRoutes(req);
      } else if (req.pathname.startsWith('/api/encryption')) {
        response = await handleEncryptionRoutes(req);
      } else if (req.pathname.startsWith('/api/data')) {
        response = await handleDataRoutes(req);
      } else if (req.pathname === '/api/health') {
        response = sendSuccess({ 
          data: {
            status: 'OK', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
          }
        });
      } else {
        response = sendNotFoundError('Route not found');
      }

      // Ensure we have a Response object
      if (!(response instanceof Response)) {
        logger.error('Handler did not return a Response object', { 
          path: req.pathname,
          method: req.method,
          responseType: typeof response
        });
        response = sendServerError('Internal response handling error');
      }

      // Log response
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        path: req.pathname,
        status: response.status,
        duration: `${duration}ms`
      });

      return response;

    } catch (error) {
      // Global error handler
      const duration = Date.now() - startTime;
      logger.errorWithStack('Unhandled server error', error, {
        duration: `${duration}ms`,
        url: rawRequest.url,
        method: rawRequest.method
      });
      
      return sendServerError('An unexpected error occurred');
    }
  },
});

// Initialize application
async function startServer() {
  try {
    logger.info('🚀 Starting Encrypted Data API...');
    
    // Enable test mocks if in test environment
    if (process.env.NODE_ENV === 'test' && process.env.MOCK_GOOGLE_AUTH === 'true') {
      logger.info('🧪 Test environment detected - enabling mocks...');
      
      // Load mock services
      try {
        const mockAuthService = await import('../tests/mocks/authService.js');
        const mockEncryptionService = await import('../tests/mocks/encryptionService.js');
        const mockDataService = await import('../tests/mocks/dataService.js');
        
        // Create global mock service references
        global.mockAuthService = mockAuthService;
        global.mockEncryptionService = mockEncryptionService;
        global.mockDataService = mockDataService;
        
        logger.info('✅ Mock services enabled: auth, encryption, data');
      } catch (error) {
        logger.warn('⚠️ Could not load mock services:', error.message);
      }
    }
    
    // Test database connection - skip in test mode if configured
    if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_DATABASE === 'true') {
      logger.info('Testing database connection...');
      try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
          throw new Error('Database connection failed');
        }
        logger.info('✅ Database connected successfully');
        
        // Initialize database tables
        logger.info('Initializing database tables...');
        await initDatabase();
        logger.info('✅ Database tables initialized successfully');
      } catch (error) {
        if (process.env.NODE_ENV === 'test') {
          logger.warn('⚠️ Database connection failed in test mode - continuing without database');
        } else {
          throw error;
        }
      }
    } else {
      logger.warn('📊 Database: Disabled for testing environment');
    }
    
    // Initialize Firebase - skip in test mode if configured
    if (process.env.SKIP_FIREBASE_INIT !== 'true') {
      logger.info('Initializing Firebase...');
      initializeFirebase();
      logger.info('✅ Firebase initialized successfully');
    } else {
      logger.warn('🔥 Firebase: Disabled for testing environment');
    }
    
    // Start cleanup interval for expired rate limit records
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => {
        try {
          cleanupExpiredRecords();
          logger.debug('Rate limit cleanup completed');
        } catch (error) {
          logger.errorWithStack('Rate limit cleanup failed', error);
        }
      }, 60000); // Run every minute
    }
    
    logger.info(`✅ Server running on http://localhost:${PORT}`);
    logger.info(`🌐 CORS: Allowing all origins (*)`);
    logger.info(`🛡️  Security: Rate limiting ${process.env.NODE_ENV === 'test' ? 'disabled' : 'enabled'}`);
    logger.info(`📝 Logging: Level set to ${process.env.LOG_LEVEL || 'info'}`);
    
  } catch (error) {
    logger.errorWithStack('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    // Close database connection
    await closeConnection();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.errorWithStack('Uncaught Exception', error);
  process.exit(1);
});

// Start the server
startServer(); 