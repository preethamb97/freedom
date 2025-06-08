# 🏴‍☠️ Freedom - Complete Documentation

> *"Dreams never end!"* - Marshall D. Teach (but we're using this quote for good!)

**Freedom** is your encrypted data treasure vault, inspired by the spirit of adventure and freedom from One Piece! This documentation will guide you through every aspect of your journey on the Grand Line of data security.

## 📚 **Table of Contents**

1. [🗺️ Getting Started](#getting-started)
2. [⚙️ Configuration](#configuration)
3. [🏴‍☠️ Architecture](#architecture)
4. [🔐 Security Features](#security-features)
5. [🚀 Deployment](#deployment)
6. [📊 Analytics](#analytics)
7. [🛡️ Error Handling](#error-handling)
8. [🎯 API Documentation](#api-documentation)
9. [🧪 Testing](#testing)
10. [🔧 Troubleshooting](#troubleshooting)

## 🗺️ **Getting Started**

### **🚢 Quick Setup (Luffy's Way - Simple and Direct!)**

```bash
# Clone your treasure map
git clone https://github.com/yourusername/encrypted-data-ui.git
cd encrypted-data-ui

# Set sail with one command!
./setup.sh    # Linux/macOS
# or
setup.bat     # Windows

# Your ship is now sailing!
# Frontend: http://localhost:5001
# API: http://localhost:5000
```

### **⚓ Manual Setup (For Experienced Pirates)**

1. **Install Dependencies**
   ```bash
   # Install Docker and Docker Compose
   # Visit: https://docs.docker.com/get-docker/
   ```

2. **Configure Environment**
   ```bash
   # Copy environment templates
   cp API/env.example API/.env
   # Edit API/.env with your credentials
   ```

3. **Launch Services**
   ```bash
   docker-compose up -d
   ```

## ⚙️ **Configuration**

### **🏴‍☠️ Environment Variables**

#### **API Configuration (API/.env)**
```env
# 🏴‍☠️ Freedom API Configuration

# MongoDB Atlas (Your treasure vault)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freedom_db

# Google OAuth 2.0 (Crew authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Security (Haki protection)
JWT_SECRET=your_ultra_secure_jwt_secret_minimum_64_characters_long

# Server Configuration
NODE_ENV=production
PORT=3001

# Rate Limiting (Defense against spam attacks)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

# Encryption Settings
ENCRYPTION_ALGORITHM=aes-256-gcm
IV_LENGTH=16
```

#### **Frontend Configuration (WEBAPP/.env)**
```env
# 🌊 Freedom Frontend Configuration

# API Connection (Ship communication)
REACT_APP_API_URL=https://encryptedapi.trackitall.in

# Google OAuth (Crew verification)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

# Firebase Analytics (Adventure tracking)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# App Configuration
REACT_APP_APP_NAME=Freedom
REACT_APP_VERSION=1.0.0
```

## 🏴‍☠️ **Architecture**

### **🚢 System Overview**

```
🌊 Internet
    ↓
🏴‍☠️ Nginx (Reverse Proxy & SSL)
    ↓
📱 React Frontend (WEBAPP)
    ↓ (API Calls)
⚡ Node.js Backend (API)
    ↓
🗄️ MongoDB Atlas (Database)
```

### **🏗️ Project Structure**

```
encrypted-data-ui/
├── 🚢 API/                      # Backend Crew
│   ├── src/
│   │   ├── controllers/         # Route Handlers (Nami's Navigation)
│   │   │   ├── authController.js
│   │   │   ├── encryptionController.js
│   │   │   └── dataController.js
│   │   ├── models/              # Data Models (Treasure Maps)
│   │   │   ├── User.js
│   │   │   ├── UserEncryption.js
│   │   │   └── EncryptedData.js
│   │   ├── services/            # Business Logic (Battle Strategies)
│   │   │   ├── authService.js
│   │   │   ├── encryptionService.js
│   │   │   └── dataService.js
│   │   ├── helpers/             # Utilities (Crew Support)
│   │   │   ├── encryption.js
│   │   │   ├── rateLimiter.js
│   │   │   └── analytics.js
│   │   ├── middleware/          # Middleware (Ship Defenses)
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── security.js
│   │   └── routes/              # API Routes (Ship Paths)
│   │       ├── auth.js
│   │       ├── encryption.js
│   │       └── data.js
│   ├── Dockerfile               # Container Build Instructions
│   └── package.json             # Dependencies
├── 🌊 WEBAPP/                   # Frontend Crew
│   ├── src/
│   │   ├── atoms/               # Basic Components (Crew Members)
│   │   ├── molecules/           # Combined Components (Attack Combos)
│   │   ├── organisms/           # Complex Components (Ship Systems)
│   │   ├── pages/               # Application Pages (Islands)
│   │   ├── services/            # API Calls (Messenger Birds)
│   │   ├── hooks/               # React Hooks (Special Abilities)
│   │   └── utils/               # Utilities (Tools)
│   ├── Dockerfile               # Container Build Instructions
│   └── package.json             # Dependencies
├── 🐳 docker-compose.yml        # Ship Deployment Configuration
├── ⚙️ setup.sh                 # Automatic Setup Script (Linux/macOS)
├── ⚙️ setup.bat                # Automatic Setup Script (Windows)
└── 📚 README.md                # Adventure Guide
```

## 🔐 **Security Features**

### **🛡️ Encryption (Your Devil Fruit Powers)**

1. **AES-256-GCM Encryption**
   - Industry-standard encryption
   - Authenticated encryption with additional data (AEAD)
   - Unique initialization vectors (IV) for each encryption

2. **Client-Side Encryption**
   - Data encrypted before leaving your device
   - Server never sees unencrypted data
   - Zero-knowledge architecture

3. **64-Character Encryption Keys**
   - User-generated or auto-generated
   - Alphanumeric characters only
   - Strong pattern validation

### **🔒 Authentication & Authorization**

1. **Google OAuth 2.0**
   - Secure third-party authentication
   - No password storage required
   - JWT token-based sessions

2. **JWT Security**
   - Signed tokens with expiration
   - User identification and session management
   - Automatic token refresh

### **🚫 Rate Limiting & Protection**

1. **API Rate Limiting**
   - Per-IP request limits
   - Configurable time windows
   - Automatic IP blocking for abuse

2. **Input Validation**
   - Comprehensive data sanitization
   - XSS protection
   - SQL injection prevention

## 🚀 **Deployment**

### **🐳 Docker Deployment (Recommended)**

The application uses a simplified Docker configuration with a single `docker-compose.yml` file:

```yaml
# docker-compose.yml
services:
  api:
    build: ./API
    ports:
      - "5000:3001"
    environment:
      - NODE_ENV=production
    
  webapp:
    build: ./WEBAPP
    ports:
      - "5001:80"
    depends_on:
      - api
```

**Deployment Commands:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### **🌐 Production URLs**

- **Frontend**: https://encryptedui.trackitall.in/
- **API**: https://encryptedapi.trackitall.in/
- **Health Check**: https://encryptedapi.trackitall.in/api/health

## 📊 **Analytics**

### **🔥 Firebase Analytics Integration**

Freedom includes comprehensive analytics tracking:

1. **User Journey Tracking**
   ```javascript
   // Page views
   trackPageView('/home', 'Home Page');
   
   // User interactions
   trackUserInteraction('encryption_created', { name: 'My Encryption' });
   
   // Performance metrics
   trackPerformance('api_response_time', 250, true);
   ```

2. **Security Event Monitoring**
   ```javascript
   // Failed login attempts
   trackSecurityEvent('failed_login', userEmail);
   
   // Encryption activities
   trackEncryptionActivity('data_encrypted', encryptionId);
   ```

3. **Error Tracking**
   ```javascript
   // API errors
   trackErrors.apiError('/api/data', 404, 'Not Found');
   
   // Component errors
   trackErrors.componentError('EncryptionForm', error.message);
   ```

## 🛡️ **Error Handling**

### **⚡ Error Boundaries**

React Error Boundaries catch and handle component crashes:

```javascript
// ErrorBoundary component automatically wraps all routes
<ErrorBoundary>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/home" element={<HomePage />} />
  </Routes>
</ErrorBoundary>
```

### **🔄 Automatic Recovery**

1. **API Retry Logic**
   - Automatic retry for failed requests
   - Exponential backoff strategy
   - Configurable retry attempts

2. **Network Monitoring**
   - Connection status detection
   - Offline/online event handling
   - User notification for connectivity issues

## 🎯 **API Documentation**

### **🔐 Authentication Endpoints**

#### **POST /api/auth/google**
Authenticate user with Google OAuth token.

```bash
curl -X POST https://encryptedapi.trackitall.in/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "google_oauth_token"}'
```

#### **GET /api/auth/profile**
Get authenticated user profile.

```bash
curl -X GET https://encryptedapi.trackitall.in/api/auth/profile \
  -H "Authorization: Bearer jwt_token"
```

### **🗝️ Encryption Endpoints**

#### **POST /api/encryption**
Create new encryption.

```bash
curl -X POST https://encryptedapi.trackitall.in/api/encryption \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Secret Treasure",
    "encryptionKey": "64_character_encryption_key_here"
  }'
```

#### **GET /api/encryption**
Get all user encryptions.

```bash
curl -X GET https://encryptedapi.trackitall.in/api/encryption \
  -H "Authorization: Bearer jwt_token"
```

### **📊 Data Endpoints**

#### **POST /api/data**
Store encrypted data.

```bash
curl -X POST https://encryptedapi.trackitall.in/api/data \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "encryption_id": "encryption_id_here",
    "text": "Secret data to encrypt",
    "encryptionKey": "64_character_encryption_key"
  }'
```

#### **GET /api/data/:encryptionId**
Retrieve and decrypt data.

```bash
curl -X GET "https://encryptedapi.trackitall.in/api/data/encryption_id?passphrase=64_char_key&offset=0&limit=10" \
  -H "Authorization: Bearer jwt_token"
```

## 🧪 **Testing**

### **🔬 Running Tests**

```bash
# Run API tests
cd API && npm test

# Run Frontend tests
cd WEBAPP && npm test

# Run integration tests
npm run test:integration
```

### **📊 Test Coverage**

- **API Tests**: Unit tests for all controllers and services
- **Frontend Tests**: Component tests with React Testing Library
- **Integration Tests**: End-to-end API testing
- **Security Tests**: Encryption and authentication validation

## 🔧 **Troubleshooting**

### **🚨 Common Issues**

1. **Docker Issues**
   ```bash
   # Clean Docker environment
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

2. **Environment Variables**
   ```bash
   # Check if .env files exist and are configured
   ls -la API/.env WEBAPP/.env
   ```

3. **Port Conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :5000  # API port
   lsof -i :5001  # Frontend port
   ```

4. **MongoDB Connection**
   ```bash
   # Test MongoDB Atlas connection
   curl -X GET "https://encryptedapi.trackitall.in/api/health"
   ```

### **📋 Health Checks**

- **API Health**: `GET /api/health`
- **Database Health**: `GET /api/health/detailed`
- **Service Status**: `docker-compose ps`

### **📜 Logs**

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f webapp

# View error logs only
docker-compose logs -f | grep ERROR
```

## 🏴‍☠️ **Development Guidelines**

### **🎯 Code Style**

- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **Conventional Commits** for commit messages

### **🔒 Security Guidelines**

1. **Never log sensitive data**
2. **Validate all inputs**
3. **Use HTTPS everywhere**
4. **Implement proper error handling**
5. **Follow principle of least privilege**

### **📈 Performance Guidelines**

1. **Optimize bundle sizes**
2. **Use lazy loading**
3. **Implement caching strategies**
4. **Monitor API response times**
5. **Use CDN for static assets**

---

## 🏴‍☠️ **The Spirit of Freedom**

*"I want to be free! I want to be able to do whatever I want!"* - Monkey D. Luffy

Just like Luffy's quest for ultimate freedom on the seas, **Freedom** gives you complete control over your data. Your encryption keys are your Devil Fruit powers - unique, powerful, and yours alone to wield.

**⚡ Set sail with Freedom and protect your digital treasures! ⚡**

---

<div align="center">

**🏴‍☠️ Built with the spirit of adventure and the power of encryption 🏴‍☠️**

*May your data be as secure as the One Piece treasure!*

</div> 