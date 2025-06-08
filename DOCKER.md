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
- **API**: Node.js/Bun.js backend server
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

### Required WEBAPP Environment Variables
```bash
# API Connection
REACT_APP_API_URL=https://yourdomain.com

# Firebase (Google Auth)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## Local Development

### Quick Local Setup
```bash
# Start local development environment
./local-deploy.sh up

# Access services
# Frontend: http://localhost:3000
# API: http://localhost:3001
# MongoDB: Use MongoDB Compass

# View logs
./local-deploy.sh logs

# Stop services
./local-deploy.sh down
```

### Local Development Features
- **Hot Reload**: Both frontend and backend
- **Database**: Cloud MongoDB Atlas
- **Isolation**: Separate from production
- **Debug Tools**: Enhanced logging and error reporting

## Service Access

### Production URLs
- **Application**: https://yourdomain.com
- **API**: https://yourdomain.com/api
- **Health Check**: https://yourdomain.com/api/health

### Development URLs
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001  
- **Health Check**: http://localhost:3001/api/health
- **MongoDB**: Connect via MongoDB Compass

### Local Development URLs
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Nginx**: http://localhost:8080
- **MongoDB**: Connect via MongoDB Compass

## Monitoring and Logs

### Real-time Monitoring
```bash
# Follow all service logs
./deploy.sh logs

# Follow specific service
./deploy.sh logs api
./deploy.sh logs webapp

# Docker native logging
docker-compose logs -f
```

### Service Health Checks
```bash
# Application health check
./deploy.sh health

# Individual service checks
curl http://localhost:3001/api/health
curl http://localhost:3000
```

### Container Monitoring
```bash
# View running containers
docker ps

# Container resource usage
docker stats

# Container details
docker inspect encrypted-data-api
```

## Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check port conflicts
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

#### Database Connection Issues
```bash
# Check API logs for database errors
./deploy.sh logs api | grep -i mongo

# Verify MongoDB Atlas connection string
# Check network access in Atlas dashboard
# Ensure IP is whitelisted
```

#### Environment Configuration
```bash
# Verify environment files exist
ls -la API/.env WEBAPP/.env

# Check environment variables are loaded
./deploy.sh logs api | grep -i env
```

### Clean Restart Process
```bash
# Complete clean restart
./deploy.sh clean-all
./deploy.sh up
```

### Database Connection Testing
```bash
# Test MongoDB connection via API health endpoint
curl http://localhost:3001/api/health

# Check API logs for database status
./deploy.sh logs api | grep -i database
```

## Performance Optimization

### Container Optimization
- **Multi-stage builds**: Reduced image sizes
- **Volume caching**: Faster rebuilds
- **Resource limits**: Prevent resource exhaustion
- **Health checks**: Automatic container restart

### Database Optimization  
- **Connection pooling**: Efficient database connections
- **Query optimization**: Indexed collections
- **Atlas monitoring**: Performance insights
- **Automatic scaling**: Atlas auto-scaling

### Network Optimization
- **Nginx caching**: Static file caching
- **Gzip compression**: Reduced transfer sizes
- **Keep-alive**: Persistent connections
- **CDN integration**: Global content delivery

## Security Considerations

### Container Security
- **Non-root user**: Containers run as non-root
- **Minimal images**: Alpine-based images
- **Security updates**: Regular base image updates
- **Network isolation**: Docker network security

### Database Security
- **Atlas encryption**: Data encrypted at rest and in transit
- **Network access**: IP whitelisting
- **Authentication**: Username/password + connection string
- **Audit logging**: Atlas provides audit logs

### Application Security
- **HTTPS**: SSL/TLS encryption
- **CORS**: Cross-origin request security
- **Rate limiting**: API request throttling
- **Input validation**: Request sanitization

## Scaling and Production

### Horizontal Scaling
```bash
# Scale API service
docker-compose up -d --scale api=3

# Scale with load balancer
# Configure Nginx upstream servers
```

### Vertical Scaling
```yaml
# Resource limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### Production Considerations
- **Load balancing**: Multiple API instances
- **Database scaling**: MongoDB Atlas auto-scaling
- **SSL certificates**: Automatic renewal
- **Monitoring**: Application and infrastructure monitoring
- **Backups**: Regular database backups
- **Disaster recovery**: Multi-region deployment

## Maintenance

### Regular Maintenance Tasks
```bash
# Update Docker images
docker-compose pull
./deploy.sh restart

# Clean up unused resources
docker system prune -f

# Update application code
git pull
./deploy.sh restart

# Database maintenance via Atlas dashboard
```

### Backup Procedures
```bash
# Application configuration backup
tar -czf config-backup.tar.gz API/.env WEBAPP/.env nginx/

# Database backups handled by MongoDB Atlas
# Configure automated backups in Atlas dashboard
```

## Advanced Configuration

### Custom Nginx Configuration
```bash
# Edit nginx configuration
vim nginx/conf.d/default.conf

# Restart nginx service
./deploy.sh restart
```

### SSL Certificate Management
```bash
# Initial SSL setup
./deploy.sh ssl-init

# Renew certificates
./deploy.sh ssl-renew

# Check certificate status
./deploy.sh ssl-status
```

### Environment-Specific Configurations
```bash
# Production deployment
./deploy.sh up prod

# Staging deployment
./deploy.sh up staging

# Development deployment
./deploy.sh up dev
```

This Docker deployment guide provides comprehensive instructions for deploying and managing the Encrypted Data UI application using Docker containers with MongoDB Atlas as the cloud database solution. 