# Nginx Proxy Configuration

This document explains how to use the separate nginx docker-compose configuration for production deployments.

## Files

- `docker-compose.yml` - Main application services (API, UI, phpMyAdmin)
- `docker-compose.nginx.yml` - Nginx reverse proxy service
- `nginx/production.conf` - Production nginx configuration with SSL and security headers

## Quick Start

### 1. Start Application Services
```bash
# Start the main application services
docker-compose up -d
```

This will start:
- **API**: Available at `http://localhost:5000`
- **UI**: Available at `http://localhost:5001`
- **phpMyAdmin**: Available at `http://localhost:5002`

### 2. Start Nginx Proxy (Optional)
```bash
# Start nginx reverse proxy
docker-compose -f docker-compose.nginx.yml up -d
```

This will start:
- **Nginx**: Available at `http://localhost` (redirects to HTTPS)
- **HTTPS**: Available at `https://localhost` (requires SSL certificates)

## SSL Certificate Setup

Before starting nginx, you need SSL certificates in the `nginx/ssl/` directory:

```bash
# Create self-signed certificates for testing
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/server.key \
  -out nginx/ssl/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Deployment Scenarios

### Development (Direct Access)
```bash
# Start only application services
docker-compose up -d

# Access services directly:
# - API: http://localhost:5000
# - UI: http://localhost:5001
# - phpMyAdmin: http://localhost:5002
```

### Production (With Nginx Proxy)
```bash
# Start application services
docker-compose up -d

# Start nginx proxy
docker-compose -f docker-compose.nginx.yml up -d

# Access through nginx:
# - Main app: https://localhost
# - Direct services still available on ports 5000, 5001, 5002
```

### Separate Server Deployment
```bash
# On application server
docker-compose up -d

# On proxy server (different machine)
# 1. Copy nginx/ directory to proxy server
# 2. Update nginx/production.conf upstream servers to point to app server IPs
# 3. Start nginx
docker-compose -f docker-compose.nginx.yml up -d
```

## Network Configuration

Both docker-compose files use the `encrypted-data-network`:
- Main services create the network
- Nginx connects to the existing network to communicate with services

## Logs

Nginx logs are stored in `nginx/logs/`:
- `access.log` - HTTP access logs
- `error.log` - Error logs

## Security Features

The production nginx configuration includes:
- **HTTPS redirect**: HTTP automatically redirects to HTTPS
- **Security headers**: HSTS, CSP, XSS protection
- **Rate limiting**: API endpoint protection
- **Static asset caching**: Optimized performance
- **File blocking**: Prevents access to sensitive files

## Environment Variables

You can customize nginx behavior using environment variables in `docker-compose.nginx.yml`:

```yaml
environment:
  - NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
  - NGINX_HOST=your-domain.com
  - NGINX_PORT=80
```

## Health Checks

Nginx includes health checks that verify configuration validity:
- Test interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3 attempts

## Stopping Services

```bash
# Stop nginx
docker-compose -f docker-compose.nginx.yml down

# Stop application services
docker-compose down

# Stop everything
docker-compose down && docker-compose -f docker-compose.nginx.yml down
``` 