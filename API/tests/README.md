# Integration Tests for Encrypted Data API

This directory contains comprehensive integration tests for all API routes in the Encrypted Data application.

## 📋 Test Coverage

### API Endpoints Tested

#### 🔐 Authentication Routes (`/api/auth`)
- `POST /api/auth/google` - Google login authentication
- `GET /api/auth/profile` - Get user profile (authenticated)  
- `PUT /api/auth/profile` - Update user profile (authenticated)

#### 🔑 Encryption Routes (`/api/encryption`)
- `POST /api/encryption` - Create new encryption (authenticated)
- `GET /api/encryption` - Get user encryptions (authenticated)
- `POST /api/encryption/:id/verify-key` - Verify encryption key (authenticated)

#### 💾 Data Routes (`/api/data`)
- `POST /api/data` - Store encrypted data (authenticated)
- `GET /api/data/:encryptionId` - Retrieve decrypted data (authenticated)

#### 🏥 Health Check
- `GET /api/health` - Health status check

### Test Categories

- **Functional Tests** - Verify endpoints work with valid inputs
- **Validation Tests** - Test input validation and error handling
- **Authentication Tests** - Verify authentication requirements
- **Error Handling** - Test error responses and edge cases
- **Security Tests** - Verify security headers and protections
- **Performance Tests** - Basic response time and concurrency checks

## 🚀 Quick Start

### Prerequisites

1. **Bun.js** - High-performance JavaScript runtime
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **MongoDB** - Database server (for full integration tests)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb-community
   
   # macOS
   brew install mongodb-community
   
   # Or use MongoDB Atlas cloud database
   # Configure MONGODB_URI in test environment
   ```

### Running Tests

#### Option 1: Full Test Suite (Recommended)
```bash
cd API
bun run test:full
```

This runs the complete integration test process:
1. Sets up test environment
2. Starts API server  
3. Runs all integration tests
4. Cleans up resources

#### Option 2: Individual Test Commands

```bash
# Setup test environment only
bun run test:setup

# Run integration tests (requires running server)
bun run test:integration  

# Run tests with Bun directly
bun run test

# Watch mode for development
bun run test:watch

# Cleanup test environment
bun run test:clean
```

#### Option 3: Manual Server + Tests

Terminal 1 - Start API server:
```bash
cd API
bun run --env-file=.env.test src/server.js
```

Terminal 2 - Run tests:
```bash
cd API
bun test tests/integration.test.js
```

## 🔧 Configuration

### Environment Variables

Tests use a separate test environment configuration:

```env
# Database - MongoDB Atlas or local MongoDB
MONGODB_URI=mongodb://localhost:27017/encrypted_data_app_test
DB_NAME=encrypted_data_app_test

# Authentication - Test keys
JWT_SECRET=test-super-secret-jwt-key-for-testing-only
JWT_EXPIRES_IN=1h

# Testing flags
NODE_ENV=test
MOCK_GOOGLE_AUTH=true
SKIP_FIREBASE_INIT=true
ENABLE_DATABASE=true
LOG_LEVEL=error
```

### Mock Services

Tests use mock services to avoid external dependencies:

- **Google Authentication** - Mocked Firebase Auth
- **Database** - Isolated test database collections
- **JWT Tokens** - Test-specific signing keys
- **Rate Limiting** - Disabled for testing

## 📁 File Structure

```
tests/
├── integration.test.js     # Main test suite
├── setup.js               # Test environment setup
├── run-tests.js           # Complete test runner
├── cleanup.js             # Test cleanup utilities
├── testConfig.js          # Test configuration
├── mocks/
│   ├── authService.js     # Mock authentication service
│   ├── encryptionService.js # Mock encryption service
│   └── dataService.js     # Mock data service
└── README.md              # This file
```

## 🧪 Test Data

### Valid Test Data
```javascript
// Authentication
const VALID_GOOGLE_TOKEN = 'mock-google-token-for-testing';

// Encryption  
const VALID_ENCRYPTION_KEY = '1234567890123456789012345678901234567890123456789012345678901234';
const VALID_PASSPHRASE = 'TestPassphrase123!';

// User data
const TEST_USER_DATA = {
  name: 'Test User',
  email: 'test@example.com', 
  photo: 'https://example.com/photo.jpg'
};
```

### Test Scenarios

Each endpoint is tested with:
- ✅ Valid inputs (happy path)
- ❌ Invalid inputs (validation errors)
- 🔒 Authentication requirements  
- 🚫 Authorization failures
- 📝 Edge cases and boundaries

## 🔍 Debugging Tests

### Verbose Logging
```bash
# Enable detailed logging
LOG_LEVEL=debug bun run test:integration
```

### Individual Test Runs
```bash  
# Run specific test suite
bun test tests/integration.test.js --grep "Authentication API"

# Run single test
bun test tests/integration.test.js --grep "should successfully authenticate"
```

### Database Inspection
```bash
# Connect to test database
mongosh mongodb://localhost:27017/encrypted_data_app_test

# View test collections
db.users.find().pretty()
db.user_encryption.find().pretty()
db.encrypted_data.find().pretty()
db.rate_limit.find().pretty()

# Clear test data
db.dropDatabase()
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Start MongoDB service
sudo systemctl start mongod

# Or for macOS
brew services start mongodb-community
```

#### Test Server Won't Start
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill any processes using the port
kill -9 $(lsof -ti:3001)
```

#### Mock Services Not Working
```bash
# Verify test environment variables
cat .env.test

# Check mock flags
MOCK_GOOGLE_AUTH=true
SKIP_FIREBASE_INIT=true
```

## 📊 Test Results

### Expected Output
```
🧪 Integration Tests for Encrypted Data API
✅ Health Check API (2 tests)
✅ Authentication API (5 tests)  
✅ Encryption API (8 tests)
✅ Data API (6 tests)
✅ Security Tests (4 tests)

Total: 25 tests passed, 0 failed
```

### Performance Benchmarks
- Health check: < 50ms
- Authentication: < 200ms
- Encryption operations: < 500ms
- Data storage/retrieval: < 1s

## 🔒 Security Testing

Tests verify:
- **CORS headers** are properly set
- **Authentication** is required for protected routes
- **Input validation** prevents injection attacks
- **Rate limiting** mechanisms work correctly
- **Error messages** don't leak sensitive information

## 🚀 Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: |
    cd API
    bun run test:full
  env:
    MONGODB_URI: ${{ secrets.MONGODB_TEST_URI }}
    JWT_SECRET: ${{ secrets.JWT_TEST_SECRET }}
```

## 📞 Support

If tests fail:
1. Check **prerequisites** are installed
2. Verify **database connection** 
3. Review **environment variables**
4. Enable **verbose logging**
5. Check **recent code changes** that might affect API

For additional help, see the main project documentation. 