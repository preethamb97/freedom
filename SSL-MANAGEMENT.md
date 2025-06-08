# SSL Certificate Management with Let's Encrypt

This guide covers automatic SSL certificate management for your multi-app hosting platform using Let's Encrypt certificates that are **completely free** and automatically renewed.

## 🔐 Features

- **Free SSL Certificates**: Let's Encrypt provides free SSL certificates
- **Automatic Renewal**: Certificates auto-renew before expiration
- **Multi-Domain Support**: Manage certificates for multiple applications
- **Production Ready**: HTTPS enforcement with security headers
- **Easy Management**: Simple scripts for certificate operations

## 🚀 Quick Setup

### 1. Start SSL Management Stack
```bash
# Create proxy network (if not already created)
docker network create proxy-network

# Start SSL-enabled nginx and certbot
docker-compose -f docker-compose.certbot.yml up -d
```

### 2. Configure Your Domains
```bash
# Initialize domain configuration
./scripts/ssl-manager.sh init

# Edit the domains configuration file
nano scripts/domains.conf
```

Add your domains in this format:
```
# app_name:domain1,domain2,domain3
encrypted-data:yourdomain.com,www.yourdomain.com
blog:blog.yourdomain.com
portfolio:portfolio.yourdomain.com,www.portfolio.yourdomain.com
```

### 3. Set Up DNS Records
Before obtaining certificates, ensure your domains point to your server:

```
A    yourdomain.com              → your-server-ip
A    www.yourdomain.com         → your-server-ip
A    blog.yourdomain.com        → your-server-ip
A    portfolio.yourdomain.com   → your-server-ip
```

### 4. Obtain SSL Certificates
```bash
# Get certificates for all configured domains
./scripts/ssl-manager.sh obtain-all

# Or get certificate for specific app
./scripts/ssl-manager.sh obtain encrypted-data yourdomain.com,www.yourdomain.com
```

### 5. Set Up Automatic Renewal
```bash
# Add to crontab for automatic renewal
crontab -e

# Add this line to run renewal twice daily at 2:30 AM and 2:30 PM
30 2,14 * * * /path/to/your/project/scripts/auto-renew.sh
```

## 📋 SSL Manager Commands

### Basic Commands
```bash
# Initialize domains configuration
./scripts/ssl-manager.sh init

# Obtain certificate for specific app
./scripts/ssl-manager.sh obtain app-name domain1.com,domain2.com

# Obtain certificates for all configured apps
./scripts/ssl-manager.sh obtain-all

# Renew all certificates
./scripts/ssl-manager.sh renew

# List all certificates and their status
./scripts/ssl-manager.sh list

# Show certificate status
./scripts/ssl-manager.sh status
```

### Examples
```bash
# Get certificate for your main app
./scripts/ssl-manager.sh obtain encrypted-data myapp.com,www.myapp.com

# Get certificate for a blog
./scripts/ssl-manager.sh obtain blog blog.myapp.com

# Get certificate with multiple subdomains
./scripts/ssl-manager.sh obtain portfolio portfolio.myapp.com,www.portfolio.myapp.com,dev.portfolio.myapp.com
```

## 🌐 Domain and DNS Setup

### 1. Domain Registration
- Register your domain with any domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)

### 2. DNS Configuration
Point your domains to your server's IP address:

```bash
# Example DNS records
yourdomain.com.              A     1.2.3.4
www.yourdomain.com.         A     1.2.3.4
encrypted-data.yourdomain.com. A  1.2.3.4
blog.yourdomain.com.        A     1.2.3.4
*.yourdomain.com.           A     1.2.3.4  # Wildcard (optional)
```

### 3. Verify DNS Propagation
```bash
# Check if DNS is propagated
nslookup yourdomain.com
dig yourdomain.com

# Online tools
# - https://www.whatsmydns.net/
# - https://dnschecker.org/
```

## 🔧 Adding New Applications with SSL

### 1. Create Nginx Configuration
```bash
# Copy template
cp nginx/conf.d/example-app.conf.template nginx/conf.d/my-new-app.conf

# Edit configuration
nano nginx/conf.d/my-new-app.conf
```

Replace placeholders:
- `your-app-frontend` → `my-new-app-frontend`
- `your-app.yourdomain.com` → `my-new-app.yourdomain.com`
- `your-app` → `my-new-app`

### 2. Add Domain to Configuration
```bash
# Edit domains file
nano scripts/domains.conf

# Add line:
my-new-app:my-new-app.yourdomain.com,www.my-new-app.yourdomain.com
```

### 3. Obtain SSL Certificate
```bash
# Get certificate for new app
./scripts/ssl-manager.sh obtain my-new-app my-new-app.yourdomain.com,www.my-new-app.yourdomain.com
```

### 4. Update App's Docker Compose
Ensure your app connects to the proxy network:
```yaml
services:
  my-app:
    container_name: my-new-app-frontend  # Match nginx config
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
    name: proxy-network
```

## 🔄 Certificate Renewal

### Automatic Renewal (Recommended)
```bash
# Set up cron job for automatic renewal
crontab -e

# Add this line (runs twice daily):
30 2,14 * * * /full/path/to/your/project/scripts/auto-renew.sh

# Check cron job is added
crontab -l
```

### Manual Renewal
```bash
# Renew all certificates
./scripts/ssl-manager.sh renew

# Check renewal logs
tail -f certbot/logs/auto-renew.log
```

### Certificate Expiry
- Let's Encrypt certificates are valid for 90 days
- Auto-renewal attempts renewal when certificates have 30 days left
- Successful renewals automatically reload nginx

## 📊 Monitoring and Troubleshooting

### Check Certificate Status
```bash
# List all certificates
./scripts/ssl-manager.sh list

# Check certificate expiry
openssl x509 -in nginx/ssl/encrypted-data.crt -noout -dates

# Check certificate details
openssl x509 -in nginx/ssl/encrypted-data.crt -noout -text
```

### View Logs
```bash
# Certbot logs
tail -f certbot/logs/letsencrypt.log

# Auto-renewal logs
tail -f certbot/logs/auto-renew.log

# Nginx logs
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

### Common Issues

#### 1. Domain not pointing to server
```bash
# Check DNS
nslookup yourdomain.com

# Should return your server's IP
```

#### 2. Port 80 not accessible
```bash
# Check if port 80 is open
curl -I http://yourdomain.com/.well-known/acme-challenge/test

# Check firewall
sudo ufw status
sudo iptables -L
```

#### 3. Certificate not found
```bash
# Check if certificate exists
ls -la nginx/ssl/

# Check symlinks
ls -la /var/lib/docker/volumes/*//_data/live/
```

#### 4. Nginx configuration errors
```bash
# Test nginx configuration
docker exec central-nginx-proxy-ssl nginx -t

# Reload nginx
docker exec central-nginx-proxy-ssl nginx -s reload
```

## 🔒 Security Best Practices

### 1. Certificate Storage
- Certificates are stored securely in Docker volumes
- Private keys have restricted permissions
- Regular backup of SSL directory recommended

### 2. Domain Validation
- Only obtain certificates for domains you control
- Verify DNS records before certificate requests
- Monitor certificate expiry dates

### 3. HTTPS Enforcement
- All HTTP traffic redirects to HTTPS
- HSTS headers prevent downgrade attacks
- Strong SSL ciphers and protocols only

### 4. Rate Limits
Let's Encrypt has rate limits:
- 50 certificates per domain per week
- 5 duplicate certificates per week
- Test with staging environment first

## 💡 Pro Tips

### 1. Staging Environment
```bash
# Test with Let's Encrypt staging (no rate limits)
# Add --staging flag to certbot commands for testing
docker exec ssl-certbot certbot certonly --staging --webroot ...
```

### 2. Wildcard Certificates
```bash
# Get wildcard certificate (requires DNS validation)
./scripts/ssl-manager.sh obtain wildcard "*.yourdomain.com,yourdomain.com"
```

### 3. Multiple Environments
- Use different subdomains for staging: `staging.yourdomain.com`
- Separate SSL management for production and staging
- Test certificate renewal in staging first

### 4. Backup Strategy
```bash
# Backup SSL certificates
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz nginx/ssl/

# Automated backup script
echo "0 3 * * 0 tar -czf /backup/ssl-backup-\$(date +\%Y\%m\%d).tar.gz /path/to/nginx/ssl/" | crontab -
```

## 🌟 Production Checklist

- [ ] Domain registered and DNS configured
- [ ] Server accessible on ports 80 and 443
- [ ] SSL management stack running
- [ ] Domains configured in `scripts/domains.conf`
- [ ] Certificates obtained for all apps
- [ ] Automatic renewal cron job set up
- [ ] HTTPS redirects working
- [ ] Security headers present
- [ ] Certificate monitoring in place

Your multi-app hosting platform now has **free, automatic SSL certificates** with professional-grade security! 🎉 