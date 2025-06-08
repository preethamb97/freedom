# Local Development Guide

Quick setup guide for local development using Docker with built-in MongoDB Atlas connection.

## Overview

This setup provides:
- **Self-contained setup** with cloud MongoDB Atlas database
- **Hot reloading** for both frontend and backend
- **Environment isolation** from production
- **Easy database management** via MongoDB Compass

## Quick Start

1. **Prerequisites** - Install [Docker](https://docs.docker.com/get-docker/)

2. **Clone and navigate** to project directory

3. **Set up environment files** (copy from examples and configure)

4. **Start local development environment**:
   ```bash
   ./local-deploy.sh up
   ```

5. **Access your applications**:
   - **Frontend**: http://localhost:3000 (React development server)
   - **API**: http://localhost:3001 (Bun.js server)
   - **MongoDB Compass**: Connect using your MONGODB_URI for database management

## Database Access

```bash
# Install MongoDB Compass for visual database management
# Download from: https://www.mongodb.com/products/compass
# Connect using your MONGODB_URI from the .env file
```

## Service Details

### Application Access
- **Frontend (React)**: http://localhost:3000
- **API (Bun.js)**: http://localhost:3001
- **Nginx Proxy**: http://localhost:8080 (if enabled)
- **MongoDB Compass**: Desktop application for cloud database management

## Environment Configuration

### Required Environment Files

**API/.env**:
```env
# Database Configuration (for cloud MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# Application Configuration
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:3000

# Firebase Configuration (for Google Auth)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Optional
LOG_LEVEL=info
```

**WEBAPP/.env**:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# Firebase Configuration (for Google Auth)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Command Reference

```bash
# Start all services
./local-deploy.sh up

# Stop all services
./local-deploy.sh down

# View logs
./local-deploy.sh logs
./local-deploy.sh logs api-local      # API logs only
./local-deploy.sh logs webapp-local   # Frontend logs only

# Restart services
./local-deploy.sh restart

# Clean up everything
./local-deploy.sh clean

# Force clean (removes all data)
./local-deploy.sh clean-all

# View service status
./local-deploy.sh status

# Check health
./local-deploy.sh health

# Build services only
./local-deploy.sh build
```

## Development Workflow

1. **Start the environment**:
   ```bash
   ./local-deploy.sh up
   ```

2. **Make code changes** - Both frontend and backend will automatically reload

3. **View logs** to debug issues:
   ```bash
   ./local-deploy.sh logs
   ```

4. **Access MongoDB** via MongoDB Compass using your connection string

5. **Stop when done**:
   ```bash
   ./local-deploy.sh down
   ```

## Troubleshooting

### Common Issues

**Services won't start**:
```bash
# Check if ports are already in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Clean and restart
./local-deploy.sh clean
./local-deploy.sh up
```

**Environment variables not loading**:
- Ensure `.env` files exist in both `API/` and `WEBAPP/` directories
- Check file permissions and syntax

**Cannot connect to MongoDB**:
- Verify MONGODB_URI is correct in API/.env
- Check MongoDB Atlas network access settings
- Ensure your IP is whitelisted in MongoDB Atlas

### Service Information

#### API Service (api-local)
- **Runtime**: Bun.js with hot reloading
- **Port**: 3001
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: Firebase/Google Auth

#### Frontend Service (webapp-local)
- **Framework**: React with Create React App
- **Port**: 3000
- **Hot Reload**: Enabled via CHOKIDAR_USEPOLLING

#### Nginx Service (nginx-local)
- **Purpose**: Reverse proxy for combined access
- **Port**: 8080
- **Configuration**: nginx/nginx.local.conf

#### MongoDB Database
- **Type**: Cloud-hosted MongoDB Atlas
- **Access**: MongoDB Compass desktop application
- **Connection**: Via MONGODB_URI environment variable

## Advanced Usage

### Viewing Logs
```bash
# All services
./local-deploy.sh logs

# Specific service
./local-deploy.sh logs api-local

# Follow logs in real-time
./local-deploy.sh logs -f
```

### Database Management
Connect to your MongoDB Atlas database using MongoDB Compass:
1. Download and install MongoDB Compass
2. Use your MONGODB_URI connection string
3. Browse collections, run queries, and manage data

### Rebuilding Services
```bash
# Rebuild specific service
docker-compose -f docker-compose.local.yml build api-local

# Rebuild all services
./local-deploy.sh build
```

## Next Steps

Once your local development is working:
1. **Deploy to staging**: Follow [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Set up MongoDB Atlas**: Follow [MONGODB-ATLAS-SETUP.md](MONGODB-ATLAS-SETUP.md)
3. **Configure production**: Follow [UBUNTU-SERVER-SETUP.md](UBUNTU-SERVER-SETUP.md) 