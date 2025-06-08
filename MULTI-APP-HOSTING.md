# Multi-Application Hosting with Nginx Proxy

This setup allows you to host multiple applications behind a single nginx reverse proxy, making it easy to manage multiple services with SSL, security headers, and centralized routing.

## 🏗️ Architecture

```
Internet → Nginx Proxy → Application 1 (encrypted-data-app)
                     → Application 2 (your-next-app)
                     → Application 3 (another-app)
                     → phpMyAdmin
```

## 📁 File Structure

```
nginx/
├── conf.d/
│   ├── 00-default.conf              # Landing page configuration
│   ├── encrypted-data-app.conf      # Encrypted data app config
│   └── example-app.conf.template    # Template for new apps
├── html/
│   └── index.html                   # Landing page HTML
├── ssl/                             # SSL certificates directory
├── logs/                            # Nginx logs
└── nginx.conf                       # Main nginx configuration

docker-compose.yml                   # Main application services
docker-compose.nginx.yml            # Central nginx proxy
```

## 🚀 Quick Start

### 1. Create Proxy Network
```bash
# Create the shared network for all applications
docker network create proxy-network
```

### 2. Start Nginx Proxy
```bash
# Start the central nginx proxy
docker-compose -f docker-compose.nginx.yml up -d
```

### 3. Start Your Applications
```bash
# Start the encrypted data app
docker-compose up -d

# Start other applications (each in their own directory)
cd /path/to/another-app
docker-compose up -d
```

### 4. Access Applications
- **Landing Page**: http://localhost or https://localhost
- **Encrypted Data App**: https://encrypted-data.localhost
- **phpMyAdmin**: http://localhost:5002
- **Direct API Access**: http://localhost:5000
- **Direct UI Access**: http://localhost:5001

## 🔧 Adding New Applications

### Step 1: Create App Configuration
```bash
# Copy the template
cp nginx/conf.d/example-app.conf.template nginx/conf.d/my-new-app.conf

# Edit the configuration
nano nginx/conf.d/my-new-app.conf
```

### Step 2: Update the Configuration
Replace these placeholders in your new config file:
- `your-app-frontend` → `my-new-app-frontend`
- `your-app-api` → `my-new-app-api`
- `your-app.localhost` → `my-new-app.localhost`
- `your-app.crt` → `my-new-app.crt`
- `your-app.key` → `my-new-app.key`

### Step 3: Create SSL Certificates
```bash
# Create SSL certificate for your new app
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/my-new-app.key \
  -out nginx/ssl/my-new-app.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=my-new-app.localhost"
```

### Step 4: Update App's Docker Compose
Make sure your application's `docker-compose.yml` includes:
```yaml
services:
  my-app:
    container_name: my-new-app-frontend  # Match nginx config
    networks:
      - proxy-network  # Connect to proxy network
    # ... other configuration

networks:
  proxy-network:
    external: true
    name: proxy-network
```

### Step 5: Update Landing Page
Edit `nginx/html/index.html` to add your new app:
```html
<div class="app-card">
    <h3>🚀 My New App</h3>
    <p>Description of your new application.</p>
    <a href="https://my-new-app.localhost" class="app-link">Launch App</a>
</div>
```

### Step 6: Restart Nginx
```bash
docker-compose -f docker-compose.nginx.yml restart
```

## 🔐 SSL Certificate Management

### Default Certificates
Create default certificates for the landing page:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/default.key \
  -out nginx/ssl/default.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### App-Specific Certificates
Each app should have its own SSL certificate:
```bash
# For encrypted-data app
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/encrypted-data.key \
  -out nginx/ssl/encrypted-data.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=encrypted-data.localhost"
```

### Production Certificates
For production, replace self-signed certificates with real ones from Let's Encrypt:
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/yourdomain.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/yourdomain.key
```

## 🌐 Domain Configuration

### Local Development
Add entries to your `/etc/hosts` file:
```
127.0.0.1 encrypted-data.localhost
127.0.0.1 my-new-app.localhost
127.0.0.1 another-app.localhost
```

### Production
Update DNS records to point to your server:
```
A    encrypted-data.yourdomain.com    → your-server-ip
A    my-new-app.yourdomain.com        → your-server-ip
A    another-app.yourdomain.com       → your-server-ip
```

## 📊 Monitoring & Logs

### View Logs
```bash
# Nginx access logs
tail -f nginx/logs/access.log

# Nginx error logs
tail -f nginx/logs/error.log

# Container logs
docker logs central-nginx-proxy
```

### Health Checks
- **Nginx Status**: http://localhost/nginx_status
- **Overall Health**: http://localhost/health
- **App Health**: https://encrypted-data.localhost/health

## 🛠️ Management Commands

### Start All Services
```bash
# Start proxy
docker-compose -f docker-compose.nginx.yml up -d

# Start applications
docker-compose up -d
```

### Stop All Services
```bash
# Stop applications
docker-compose down

# Stop proxy
docker-compose -f docker-compose.nginx.yml down
```

### Restart Nginx (reload config)
```bash
docker-compose -f docker-compose.nginx.yml restart
```

### Scale Applications
```bash
# Scale a specific app
docker-compose up -d --scale webapp=3
```

## 🔒 Security Features

- **HTTPS Enforcement**: All HTTP traffic redirects to HTTPS
- **Security Headers**: HSTS, CSP, XSS protection
- **Rate Limiting**: API endpoint protection
- **File Blocking**: Prevents access to sensitive files
- **Network Isolation**: Apps can communicate but are isolated from external networks

## 🚨 Troubleshooting

### Common Issues

1. **"Network proxy-network not found"**
   ```bash
   docker network create proxy-network
   ```

2. **SSL Certificate errors**
   ```bash
   # Check certificate files exist
   ls -la nginx/ssl/
   
   # Verify certificate
   openssl x509 -in nginx/ssl/default.crt -text -noout
   ```

3. **Nginx won't start**
   ```bash
   # Test nginx configuration
   docker run --rm -v $(pwd)/nginx:/etc/nginx nginx:alpine nginx -t
   ```

4. **App not accessible**
   ```bash
   # Check if app container is running
   docker ps
   
   # Check if container is on proxy network
   docker network inspect proxy-network
   ```

### Debug Mode
```bash
# Start nginx in foreground with debug logs
docker-compose -f docker-compose.nginx.yml up --no-daemon
```

## 📚 Examples

See the `nginx/conf.d/` directory for:
- ✅ Working example: `encrypted-data-app.conf`
- 📝 Template: `example-app.conf.template`
- 🏠 Default config: `00-default.conf`

This setup makes it easy to add new applications while maintaining security, performance, and scalability! 🎉 