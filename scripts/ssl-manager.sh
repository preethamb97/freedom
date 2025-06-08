#!/bin/bash

# SSL Certificate Manager for Multi-App Hosting
# Manages Let's Encrypt certificates for multiple domains

set -e

# Configuration
CERTBOT_CONTAINER="ssl-certbot"
NGINX_CONTAINER="central-nginx-proxy-ssl"
EMAIL="" # Will be set via environment or prompt
DOMAINS_FILE="./scripts/domains.conf"
SSL_DIR="./nginx/ssl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required containers are running
check_containers() {
    log "Checking required containers..."
    
    if ! docker ps | grep -q "$CERTBOT_CONTAINER"; then
        error "Certbot container '$CERTBOT_CONTAINER' is not running"
        error "Please start with: docker-compose -f docker-compose.certbot.yml up -d"
        exit 1
    fi
    
    if ! docker ps | grep -q "$NGINX_CONTAINER"; then
        error "Nginx container '$NGINX_CONTAINER' is not running"
        error "Please start with: docker-compose -f docker-compose.certbot.yml up -d"
        exit 1
    fi
    
    success "All required containers are running"
}

# Get email for Let's Encrypt
get_email() {
    if [ -z "$EMAIL" ]; then
        if [ -f "./scripts/.email" ]; then
            EMAIL=$(cat "./scripts/.email")
        else
            read -p "Enter your email for Let's Encrypt notifications: " EMAIL
            echo "$EMAIL" > "./scripts/.email"
        fi
    fi
    
    if [ -z "$EMAIL" ]; then
        error "Email is required for Let's Encrypt certificates"
        exit 1
    fi
    
    log "Using email: $EMAIL"
}

# Initialize domains configuration
init_domains() {
    if [ ! -f "$DOMAINS_FILE" ]; then
        log "Creating domains configuration file..."
        cat > "$DOMAINS_FILE" << EOF
# Domain Configuration for SSL Certificates
# Format: app_name:domain1,domain2,domain3
# Example: 
# encrypted-data:encrypted-data.yourdomain.com,data.yourdomain.com
# blog:blog.yourdomain.com,www.blog.yourdomain.com
# api:api.yourdomain.com

# encrypted-data:encrypted-data.example.com
# blog:blog.example.com
# portfolio:portfolio.example.com
EOF
        warning "Please edit $DOMAINS_FILE to add your domains"
        warning "Format: app_name:domain1,domain2,domain3"
        exit 0
    fi
}

# Obtain certificate for a domain
obtain_certificate() {
    local app_name=$1
    local domains=$2
    
    log "Obtaining certificate for $app_name: $domains"
    
    # Convert comma-separated domains to -d arguments
    local domain_args=""
    IFS=',' read -ra DOMAIN_ARRAY <<< "$domains"
    for domain in "${DOMAIN_ARRAY[@]}"; do
        domain_args="$domain_args -d $domain"
    done
    
    # Run certbot
    docker exec "$CERTBOT_CONTAINER" certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --keep-until-expiring \
        --cert-name "$app_name" \
        $domain_args
    
    if [ $? -eq 0 ]; then
        success "Certificate obtained for $app_name"
        
        # Create symlinks for nginx
        create_nginx_symlinks "$app_name"
        
        # Reload nginx
        reload_nginx
    else
        error "Failed to obtain certificate for $app_name"
        return 1
    fi
}

# Create symlinks for nginx configuration
create_nginx_symlinks() {
    local app_name=$1
    local cert_dir="/etc/letsencrypt/live/$app_name"
    
    log "Creating nginx symlinks for $app_name"
    
    docker exec "$NGINX_CONTAINER" sh -c "
        if [ -d '$cert_dir' ]; then
            ln -sf '$cert_dir/fullchain.pem' '/etc/nginx/ssl/${app_name}.crt'
            ln -sf '$cert_dir/privkey.pem' '/etc/nginx/ssl/${app_name}.key'
            echo 'Symlinks created for $app_name'
        else
            echo 'Certificate directory not found: $cert_dir'
            exit 1
        fi
    "
}

# Reload nginx configuration
reload_nginx() {
    log "Reloading nginx configuration..."
    docker exec "$NGINX_CONTAINER" nginx -s reload
    if [ $? -eq 0 ]; then
        success "Nginx reloaded successfully"
    else
        error "Failed to reload nginx"
        return 1
    fi
}

# Renew all certificates
renew_certificates() {
    log "Renewing all certificates..."
    
    docker exec "$CERTBOT_CONTAINER" certbot renew --webroot --webroot-path=/var/www/certbot
    
    if [ $? -eq 0 ]; then
        success "Certificate renewal completed"
        reload_nginx
    else
        error "Certificate renewal failed"
        return 1
    fi
}

# List all certificates
list_certificates() {
    log "Listing all certificates..."
    docker exec "$CERTBOT_CONTAINER" certbot certificates
}

# Process all domains from configuration file
process_all_domains() {
    log "Processing all domains from $DOMAINS_FILE"
    
    while IFS=':' read -r app_name domains; do
        # Skip empty lines and comments
        [[ -z "$app_name" || "$app_name" == \#* ]] && continue
        
        log "Processing $app_name with domains: $domains"
        obtain_certificate "$app_name" "$domains"
        
    done < "$DOMAINS_FILE"
}

# Show usage
usage() {
    echo "SSL Certificate Manager"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  init                    Initialize domains configuration"
    echo "  obtain <app> <domains>  Obtain certificate for specific app"
    echo "  obtain-all             Obtain certificates for all configured domains"
    echo "  renew                  Renew all certificates"
    echo "  list                   List all certificates"
    echo "  status                 Show certificate status"
    echo ""
    echo "Examples:"
    echo "  $0 init"
    echo "  $0 obtain encrypted-data encrypted-data.example.com,data.example.com"
    echo "  $0 obtain-all"
    echo "  $0 renew"
    echo ""
    echo "Environment variables:"
    echo "  EMAIL - Email for Let's Encrypt notifications"
}

# Main script logic
main() {
    case "${1:-}" in
        init)
            init_domains
            ;;
        obtain)
            if [ $# -lt 3 ]; then
                error "Usage: $0 obtain <app_name> <domains>"
                error "Example: $0 obtain encrypted-data encrypted-data.example.com,data.example.com"
                exit 1
            fi
            check_containers
            get_email
            obtain_certificate "$2" "$3"
            ;;
        obtain-all)
            check_containers
            get_email
            init_domains
            process_all_domains
            ;;
        renew)
            check_containers
            renew_certificates
            ;;
        list)
            check_containers
            list_certificates
            ;;
        status)
            check_containers
            list_certificates
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 