#!/bin/bash

# Automatic SSL Certificate Renewal Script
# This script is designed to be run via cron job for automatic certificate renewal

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/certbot/logs/auto-renew.log"

# Change to project directory
cd "$PROJECT_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting automatic SSL certificate renewal"

# Check if containers are running
if ! docker ps | grep -q "ssl-certbot"; then
    log "WARNING: Certbot container not running, starting SSL management stack..."
    docker-compose -f docker-compose.certbot.yml up -d
    sleep 10
fi

# Run certificate renewal
log "Running certificate renewal..."
if "$SCRIPT_DIR/ssl-manager.sh" renew; then
    log "Certificate renewal completed successfully"
else
    log "ERROR: Certificate renewal failed"
    exit 1
fi

# Clean up old logs (keep last 30 days)
find "$PROJECT_DIR/certbot/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true

log "Automatic renewal process completed" 