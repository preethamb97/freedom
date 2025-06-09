# Docker Deployment Guide

Comprehensive guide for deploying the Encrypted Data UI using Docker containers with MongoDB Atlas.

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- MongoDB Atlas account (cloud database)

### Basic Deployment
```bash
# Clone the repository
git clone <your-repo-url>
cd encrypted-data-ui

# Set up environment files
cp API/env.example API/.env
cp WEBAPP/env.example WEBAPP/.env

# Configure MongoDB Atlas connection in API/.env
# Add your Firebase credentials to both .env files

# Deploy with Docker
./deploy.sh up
```

## Architecture Overview

The application uses a microservices architecture with Docker containers:

### Services
- **API**: Bun.js backend server
- **WEBAPP**: React frontend application  
- **MongoDB Atlas**: Cloud-hosted database
- **Nginx**: Reverse proxy and load balancer (production)

### Network Architecture
```
Internet → Nginx → API/WEBAPP → MongoDB Atlas (Cloud)
```

## Deployment Environments

### Production Environment
- **Domain**: Your production domain
- **SSL**: Automatic HTTPS via Certbot
- **Database**: MongoDB Atlas (cloud)
- **Monitoring**: Docker health checks
- **Scaling**: Docker Compose scaling

### Development Environment  
- **Ports**: Direct port access (3000, 3001)
- **Hot Reload**: Enabled for development
- **Database**: MongoDB Atlas (cloud)
- **Debugging**: Enhanced logging

### Local Development Environment
- **Isolation**: Separate Docker network
- **Database**: MongoDB Atlas (cloud)
- **Tools**: MongoDB Compass for database management
- **Features**: Complete development workflow

## Container Configurations

### API Container
```yaml
api:
  build: ./API
  ports: ["5000:3001"]
  environment:
    - NODE_ENV=production
    - MONGODB_URI=mongodb+srv://...
  networks: ["encrypted-data-network"]
```

### WEBAPP Container  
```yaml
webapp:
  build: ./WEBAPP
  ports: ["5001:80"]
  depends_on: ["api"]
  networks: ["encrypted-data-network"]
```

### Nginx Container (Production)
```yaml
nginx:
  image: nginx:alpine
  ports: ["80:80", "443:443"]
  volumes: ["./nginx/conf.d:/etc/nginx/conf.d"]
```

## Database Integration

### MongoDB Atlas Setup
1. **Create MongoDB Atlas Account**
   - Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a new cluster
   - Set up database user
   - Configure network access

2. **Get Connection String**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```

3. **Environment Configuration**
   ```bash
   # API/.env
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```

### Database Management
- **MongoDB Compass**: Desktop GUI for database management
- **Atlas Dashboard**: Web-based database monitoring
- **Connection**: Direct via connection string

## Deployment Commands

### Basic Operations
```bash
# Start all services
./deploy.sh up

# Start in development mode
./deploy.sh up dev

# Stop all services
./deploy.sh down

# Restart services
./deploy.sh restart

# View service status
./deploy.sh status
```

### Advanced Operations
```bash
# Build images only
./deploy.sh build

# View logs (all services)
./deploy.sh logs

# View specific service logs
./deploy.sh logs api

# Health check
./deploy.sh health

# Clean up resources
./deploy.sh clean

# Deep clean (including images)
./deploy.sh clean-all
```

### NPM Script Shortcuts
```bash
npm run deploy:up          # ./deploy.sh up
npm run deploy:down        # ./deploy.sh down  
npm run deploy:restart     # ./deploy.sh restart
npm run deploy:logs        # ./deploy.sh logs
npm run deploy:status      # ./deploy.sh status
npm run deploy:health      # ./deploy.sh health
npm run deploy:clean       # ./deploy.sh clean
```

## Environment Variables

### Required API Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com

# Firebase (Google Auth)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
```