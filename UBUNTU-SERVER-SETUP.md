# Ubuntu 22.04 Server Setup Guide

Complete guide for setting up a production Ubuntu 22.04 server for hosting the Encrypted Data UI application with MongoDB Atlas.

## Prerequisites

- Ubuntu 22.04 LTS Server
- Root or sudo access
- Domain name pointing to your server
- MongoDB Atlas account

## Quick Setup

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/encrypted-data-ui/main/scripts/ubuntu-setup.sh
chmod +x ubuntu-setup.sh
sudo ./ubuntu-setup.sh
```

## Manual Setup Steps

### 1. System Update

```bash
# Update package list
sudo apt update

# Upgrade system packages
sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 2. Security Configuration

#### Setup Firewall
```bash
# Install and configure UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change 22 if using custom port)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

#### SSH Security
```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# Port 22 (or change to custom port)
# PermitRootLogin no
# PasswordAuthentication no (if using key auth)
# PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart ssh
```

#### Fail2Ban Installation
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create custom config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo systemctl status fail2ban
```

### 3. Install Docker

```bash
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list
sudo apt update

# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (standalone)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Test Docker (after re-login)
docker run hello-world
```

### 4. Install Node.js and Bun

```bash
# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installations
node --version
npm --version
bun --version
```

### 5. MongoDB Atlas Setup

```bash
# MongoDB Atlas is a cloud database service
# No local installation required

# Install MongoDB Compass (optional, for database management)
wget https://downloads.mongodb.com/compass/mongodb-compass_1.40.4_amd64.deb
sudo dpkg -i mongodb-compass_1.40.4_amd64.deb
sudo apt-get install -f
```

#### MongoDB Atlas Configuration

1. **Create Atlas Account**
   - Visit [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster

2. **Database User Setup**
   ```bash
   # In Atlas Dashboard:
   # - Go to Database Access
   # - Add New Database User
   # - Choose username/password authentication
   # - Set appropriate privileges
   ```

3. **Network Access**
   ```bash
   # In Atlas Dashboard:
   # - Go to Network Access
   # - Add IP Address
   # - Add your server's IP address
   # - Or use 0.0.0.0/0 for all IPs (less secure)
   ```

4. **Get Connection String**
   ```bash
   # In Atlas Dashboard:
   # - Go to Clusters
   # - Click "Connect"
   # - Choose "Connect your application"
   # - Copy the connection string
   # Format: mongodb+srv://username:password@cluster.mongodb.net/database
   ```

### 6. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test Nginx
curl localhost

# Configure firewall for Nginx
sudo ufw allow 'Nginx Full'
```

### 7. SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null
```

### 8. Create Application User

```bash
# Create dedicated user for the application
sudo adduser --system --group --home /opt/encrypted-data-ui app

# Add to docker group
sudo usermod -aG docker app

# Create application directory
sudo mkdir -p /opt/encrypted-data-ui
sudo chown app:app /opt/encrypted-data-ui
```

### 9. Clone and Setup Application

```bash
# Switch to app user
sudo su - app

# Clone repository
cd /opt/encrypted-data-ui
git clone https://github.com/yourusername/encrypted-data-ui.git .

# Set up environment files
cp API/env.example API/.env
cp WEBAPP/env.example WEBAPP/.env

# Edit environment files
nano API/.env
nano WEBAPP/.env
```

### 10. Configure Environment Variables

#### API Environment (API/.env)
```bash
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits
CORS_ORIGIN=https://yourdomain.com

# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Logging
LOG_LEVEL=info
```

#### WEBAPP Environment (WEBAPP/.env)
```bash
# API Configuration
REACT_APP_API_URL=https://yourdomain.com

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 11. Deploy Application

```bash
# Build and start the application
./deploy.sh up

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Check health
./deploy.sh health
```

### 12. Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/encrypted-data-ui

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/encrypted-data-ui /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 13. Setup System Services (Optional)

```bash
# Create systemd service
sudo nano /etc/systemd/system/encrypted-data-ui.service

# Add service configuration:
[Unit]
Description=Encrypted Data UI Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/encrypted-data-ui
ExecStart=/opt/encrypted-data-ui/deploy.sh up
ExecStop=/opt/encrypted-data-ui/deploy.sh down
User=app
Group=app

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable encrypted-data-ui.service

# Start service
sudo systemctl start encrypted-data-ui.service

# Check status
sudo systemctl status encrypted-data-ui.service
```

## Monitoring and Maintenance

### Log Management

```bash
# Application logs
sudo su - app
cd /opt/encrypted-data-ui
./deploy.sh logs

# System logs
sudo journalctl -u nginx
sudo journalctl -u docker
sudo journalctl -u encrypted-data-ui

# Real-time monitoring
./deploy.sh logs -f
```

### Backup Strategy

```bash
# Create backup script
sudo nano /opt/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

mkdir -p $BACKUP_DIR

# Backup application configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/encrypted-data-ui/API/.env /opt/encrypted-data-ui/WEBAPP/.env

# Backup nginx configuration
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available/

# Database backups are handled by MongoDB Atlas
# Configure automated backups in Atlas dashboard

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Make executable
sudo chmod +x /opt/backup.sh

# Add to crontab
echo "0 2 * * * /opt/backup.sh" | sudo tee -a /etc/crontab > /dev/null
```

### Performance Monitoring

```bash
# System resource monitoring
htop
iotop
netstat -tulpn

# Docker monitoring
docker stats
docker system df

# Application monitoring
./deploy.sh health
curl https://yourdomain.com/api/health
```

### Security Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd /opt/encrypted-data-ui
sudo su - app
./deploy.sh clean
git pull
./deploy.sh up

# Monitor security logs
sudo tail -f /var/log/auth.log
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check Docker service
sudo systemctl status docker

# Check application logs
cd /opt/encrypted-data-ui
./deploy.sh logs

# Check system resources
free -h
df -h
docker system df
```

#### Database Connection Issues
```bash
# Test MongoDB Atlas connectivity
# Check API logs for connection errors
./deploy.sh logs api | grep -i mongo

# Verify Atlas configuration:
# - Network access (IP whitelist)
# - Database user credentials
# - Connection string format
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL renewal
sudo certbot renew --dry-run

# Reload nginx after certificate renewal
sudo systemctl reload nginx
```

#### Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Recovery Procedures

#### Application Recovery
```bash
# Stop application
cd /opt/encrypted-data-ui
./deploy.sh down

# Clean and restart
./deploy.sh clean
./deploy.sh up

# Check status
./deploy.sh status
./deploy.sh health
```

#### Full System Recovery
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Restart Docker
sudo systemctl restart docker

# Restart application
cd /opt/encrypted-data-ui
./deploy.sh restart

# Restart nginx
sudo systemctl restart nginx

# Check all services
sudo systemctl status docker nginx
./deploy.sh status
```

## Production Optimization

### Performance Tuning

```bash
# Docker optimization
echo 'DOCKER_OPTS="--log-driver=json-file --log-opt max-size=10m --log-opt max-file=3"' | sudo tee -a /etc/default/docker

# System optimization
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
echo 'fs.file-max=65536' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Nginx optimization
sudo nano /etc/nginx/nginx.conf
# Adjust worker_processes, worker_connections, keepalive_timeout
```

### Security Hardening

```bash
# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Install additional security tools
sudo apt install -y rkhunter chkrootkit
sudo rkhunter --update
sudo rkhunter --check
```

## Quick Reference

### Essential Commands
```bash
# Application management
./deploy.sh up          # Start application
./deploy.sh down        # Stop application
./deploy.sh restart     # Restart application
./deploy.sh status      # Check status
./deploy.sh logs        # View logs
./deploy.sh health      # Health check

# System services
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status docker
sudo systemctl restart docker

# SSL management
sudo certbot certificates
sudo certbot renew

# MongoDB Atlas management
# Use Atlas dashboard or MongoDB Compass
# Connection via MONGODB_URI in API/.env
```

### Important Paths
- Application: `/opt/encrypted-data-ui`
- Nginx config: `/etc/nginx/sites-available/encrypted-data-ui`
- SSL certificates: `/etc/letsencrypt/live/yourdomain.com/`
- Application logs: `./deploy.sh logs`
- System logs: `/var/log/`

This setup guide provides a complete production environment for the Encrypted Data UI application using MongoDB Atlas as the cloud database solution. 