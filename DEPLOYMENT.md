# Automated Build and Deployment System

This document describes the automated build and deployment system for the Encrypted Data UI application. The system builds the webapp locally, compresses it with maximum compression, pushes to git, and automatically deploys on the server.

## Overview

The deployment system consists of two main scripts:
1. **`scripts/build-and-deploy.sh`** - Local build and compression script
2. **`scripts/server-deploy.sh`** - Server-side deployment script

## Features

### 🚀 **Maximum Compression**
- **7zip Ultra Compression** (primary method): LZMA2 algorithm with maximum settings
- **XZ Compression** (fallback): tar with xz -9e compression
- **Gzip Compression** (final fallback): Standard gzip with maximum compression
- **No data loss**: All compression methods are lossless
- **Size reduction**: Typically 80-90% size reduction

### 🔄 **Automated Workflow**
- **Post-build automation**: Runs automatically after `npm run build`
- **Git integration**: Automatic commit and push to repository
- **Version management**: Timestamped builds with cleanup of old versions
- **Backup system**: Automatic backup of current deployment before updating

### 📦 **Smart Archive Management**
- **Latest symlink**: Always points to the most recent build
- **Version history**: Keeps last 5 builds for rollback
- **Deploy info**: JSON metadata for each deployment
- **Size reporting**: Shows compression ratios and file sizes

## Usage

### Local Development (Build and Push)

#### Automatic (Recommended)
```bash
# This automatically runs build-and-deploy.sh after building
npm run build
```

#### Manual Control
```bash
# Build and deploy separately
npm run build:deploy

# Or run deployment script directly
npm run deploy:push

# Or execute script manually
./scripts/build-and-deploy.sh
```

### Server Deployment

#### Automatic Deployment
```bash
# Deploy from main branch (default)
npm run deploy:server

# Or run script directly
./scripts/server-deploy.sh

# Deploy from specific branch
./scripts/server-deploy.sh --branch development
```

#### Manual Deployment
```bash
# Make script executable (first time only)
chmod +x scripts/server-deploy.sh

# Deploy latest build
./scripts/server-deploy.sh

# Deploy from specific branch
./scripts/server-deploy.sh --branch feature-branch
```

## Script Details

### Build and Deploy Script (`scripts/build-and-deploy.sh`)

#### What it does:
1. **Installs compression tools** (7zip, xz, pv)
2. **Cleans previous builds** and deploy directory
3. **Builds React application** with production settings
4. **Optimizes build** (removes source maps, unnecessary files)
5. **Compresses with maximum settings**:
   - 7zip: `7z a -t7z -m0=lzma2 -mx=9 -mfb=64 -md=32m -ms=on`
   - XZ: `tar -cJf` with `xz -9e -T0`
   - Gzip: `tar -czf` with `gzip -9`
6. **Creates deployment metadata** (commit hash, timestamps, sizes)
7. **Commits and pushes** to git repository
8. **Cleans up old archives** (keeps last 5)

#### Compression Settings Explained:
- **7zip Ultra**: Best compression ratio (~90% reduction)
  - `-mx=9`: Maximum compression level
  - `-mfb=64`: 64 fast bytes for LZMA2
  - `-md=32m`: 32MB dictionary size
  - `-ms=on`: Solid archive mode
- **XZ**: Excellent compression (~85% reduction)
  - `-9e`: Maximum compression with extreme flag
  - `-T0`: Use all available CPU threads
- **Gzip**: Good compression (~75% reduction)
  - `-9`: Maximum compression level

### Server Deploy Script (`scripts/server-deploy.sh`)

#### What it does:
1. **Checks prerequisites** (git, curl, extraction tools)
2. **Detects repository URL** from git remote
3. **Backs up current build** to `/var/backups/encrypted-data-ui/webapp-builds/`
4. **Downloads latest archive** from git repository
5. **Extracts archive** (auto-detects format)
6. **Deploys to `/var/www/encrypted-data-ui/WEBAPP/build/`**
7. **Sets correct permissions** and ownership
8. **Restarts services** (PM2, Nginx)
9. **Verifies deployment** (checks files, web server response)
10. **Cleans up** temporary files

#### Security Features:
- **User validation**: Must run as `appuser` or `root`
- **Permission management**: Sets correct file permissions (644/755)
- **Ownership control**: Ensures `appuser` owns all files
- **Backup system**: Automatic backup before deployment
- **Rollback capability**: Keeps last 5 backups for manual rollback

## File Structure

```
project-root/
├── scripts/
│   ├── build-and-deploy.sh     # Local build script
│   └── server-deploy.sh        # Server deployment script
├── deploy/                     # Git-tracked deployment directory
│   ├── webapp-build_TIMESTAMP.7z        # Compressed builds
│   ├── webapp-build_TIMESTAMP.tar.xz    # Alternative format
│   ├── deploy-info.json        # Deployment metadata
│   └── webapp-build-latest.archive      # Symlink to latest
├── WEBAPP/
│   ├── build/                  # React production build
│   ├── last-deploy-info.json   # Server deployment info
│   └── last-deployed          # Deployment timestamp
└── package.json               # Scripts configuration
```

## Server Setup

### Prerequisites on Server
```bash
# Install required tools
sudo apt update
sudo apt install -y git curl p7zip-full xz-utils

# Create backup directory
sudo mkdir -p /var/backups/encrypted-data-ui/webapp-builds
sudo chown appuser:appuser /var/backups/encrypted-data-ui/webapp-builds
```

### First Time Setup
```bash
# Clone repository to server
cd /var/www
sudo git clone https://github.com/yourusername/encrypted-data-ui.git
sudo chown -R appuser:appuser encrypted-data-ui

# Make deployment script executable
chmod +x /var/www/encrypted-data-ui/scripts/server-deploy.sh

# Run initial deployment
cd /var/www/encrypted-data-ui
./scripts/server-deploy.sh
```

## Package.json Scripts

### Added Scripts
```json
{
  "scripts": {
    "postbuild": "chmod +x scripts/build-and-deploy.sh && ./scripts/build-and-deploy.sh",
    "build:deploy": "npm run build && npm run deploy:push",
    "deploy:push": "chmod +x scripts/build-and-deploy.sh && ./scripts/build-and-deploy.sh",
    "deploy:server": "chmod +x scripts/server-deploy.sh && ./scripts/server-deploy.sh"
  }
}
```

### Script Explanations
- **`postbuild`**: Automatically runs after `npm run build`
- **`build:deploy`**: Manual build and deploy process
- **`deploy:push`**: Only run the deployment script (if build already exists)
- **`deploy:server`**: Run server deployment script

## Git Integration

### What Gets Committed
- ✅ **Compressed archives** (`.7z`, `.tar.xz`, `.tar.gz`)
- ✅ **Deployment info** (`deploy-info.json`)
- ✅ **Latest symlink** (`webapp-build-latest.archive`)
- ❌ **Build directory** (still ignored)
- ❌ **Temporary files**
- ❌ **Node modules**

### Updated .gitignore
```gitignore
# Production deployment files - ignore deploy directory contents except archives
deploy/*
!deploy/*.7z
!deploy/*.tar.xz
!deploy/*.tar.gz
!deploy/deploy-info.json
!deploy/webapp-build-latest.archive
```

## Compression Comparison

| Method | Typical Ratio | Speed | CPU Usage | Compatibility |
|--------|---------------|-------|-----------|---------------|
| 7zip Ultra | 90% reduction | Slow | High | Good |
| XZ Extreme | 85% reduction | Medium | Medium | Excellent |
| Gzip Max | 75% reduction | Fast | Low | Universal |

## Monitoring and Maintenance

### Check Deployment Status
```bash
# On server
cat /var/www/encrypted-data-ui/WEBAPP/last-deployed
cat /var/www/encrypted-data-ui/WEBAPP/last-deploy-info.json

# Check build size
du -sh /var/www/encrypted-data-ui/WEBAPP/build/

# Check backup history
ls -la /var/backups/encrypted-data-ui/webapp-builds/
```

### Manual Rollback
```bash
# List available backups
ls -la /var/backups/encrypted-data-ui/webapp-builds/

# Stop services
pm2 stop all

# Restore backup
sudo rm -rf /var/www/encrypted-data-ui/WEBAPP/build
sudo cp -r /var/backups/encrypted-data-ui/webapp-builds/build_backup_TIMESTAMP /var/www/encrypted-data-ui/WEBAPP/build
sudo chown -R appuser:appuser /var/www/encrypted-data-ui/WEBAPP/build

# Restart services
pm2 start all
sudo systemctl reload nginx
```

### Cleanup Old Archives
```bash
# Local cleanup (keeps last 5)
find deploy/ -name "webapp-build_*.* -type f | sort -r | tail -n +6 | xargs rm -f

# Server cleanup (keeps last 5 backups)
sudo find /var/backups/encrypted-data-ui/webapp-builds/ -name "build_backup_*" -type d | sort -r | tail -n +6 | xargs sudo rm -rf
```

## Troubleshooting

### Common Issues

#### Build Script Issues
```bash
# Permission denied
chmod +x scripts/build-and-deploy.sh

# Missing compression tools
sudo apt install p7zip-full xz-utils pv

# Git issues
git remote -v  # Check remote URL
git status     # Check git status
```

#### Server Deployment Issues
```bash
# Check server script logs
./scripts/server-deploy.sh 2>&1 | tee deploy.log

# Check permissions
ls -la /var/www/encrypted-data-ui/WEBAPP/build/

# Check services
pm2 status
sudo systemctl status nginx

# Check disk space
df -h
```

#### Archive Issues
```bash
# Test archive integrity
7z t deploy/webapp-build_*.7z        # Test 7z
tar -tJf deploy/webapp-build_*.tar.xz # Test xz
tar -tzf deploy/webapp-build_*.tar.gz # Test gzip

# Manual extraction test
mkdir test && cd test
7z x ../deploy/webapp-build_*.7z
ls -la build/
```

### Performance Optimization

#### Local Build Optimization
```bash
# Use more CPU threads for compression
export XZ_OPT="-T0"  # Use all threads for XZ

# Use RAM disk for faster builds (Linux)
sudo mount -t tmpfs -o size=2G tmpfs /tmp/build-temp
```

#### Server Optimization
```bash
# Use faster extraction
export XZ_OPT="-T0"

# Parallel downloads
git config --global fetch.parallel 4
```

## Security Considerations

1. **Archive Integrity**: All archives are verified before extraction
2. **Permission Management**: Strict file permissions (644/755)
3. **User Validation**: Scripts validate running user
4. **Backup System**: Automatic backups before deployment
5. **Service Management**: Graceful service restarts
6. **Temporary Cleanup**: Automatic cleanup of temporary files

This deployment system provides a robust, secure, and efficient way to deploy your React application with maximum compression and minimal downtime. 