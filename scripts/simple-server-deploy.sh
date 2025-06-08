#!/bin/bash

# Simple Server Deployment Script for Encrypted Data UI
# This script pulls from git and moves the build directory to /var/www/encrypted-data-ui

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER="appuser"
APP_DIR="/var/www/encrypted-data-ui"
WEBAPP_DIR="$APP_DIR/WEBAPP"
BUILD_DIR="$WEBAPP_DIR/build"
BACKUP_DIR="/var/backups/encrypted-data-ui/webapp-builds"
BRANCH="main"  # Default branch

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if running as correct user
    if [ "$USER" != "$DEPLOY_USER" ] && [ "$USER" != "root" ]; then
        print_error "This script should be run as $DEPLOY_USER or root"
        exit 1
    fi
    
    # Check if we're in the app directory
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory not found: $APP_DIR"
        print_error "Please ensure the application is cloned to $APP_DIR"
        exit 1
    fi
    
    # Check if git repository exists
    if [ ! -d "$APP_DIR/.git" ]; then
        print_error "Git repository not found in $APP_DIR"
        print_error "Please ensure the application is cloned from git"
        exit 1
    fi
    
    print_success "Prerequisites checked"
}

# Function to create backup of current build
backup_current_build() {
    print_status "Creating backup of current build..."
    
    if [ -d "$BUILD_DIR" ]; then
        # Create backup directory
        sudo mkdir -p "$BACKUP_DIR"
        
        # Create backup with timestamp
        local backup_name="build_backup_$(date +%Y%m%d_%H%M%S)"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        sudo cp -r "$BUILD_DIR" "$backup_path"
        sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$backup_path" 2>/dev/null || true
        
        print_success "Current build backed up to: $backup_path"
        
        # Keep only last 5 backups
        sudo find "$BACKUP_DIR" -maxdepth 1 -name "build_backup_*" -type d | sort -r | tail -n +6 | xargs sudo rm -rf 2>/dev/null || true
    else
        print_warning "No existing build directory found to backup"
    fi
}

# Function to pull latest from git
pull_latest_build() {
    print_status "Pulling latest build from git..."
    
    cd "$APP_DIR"
    
    # Fetch latest changes
    print_status "Fetching latest changes..."
    git fetch origin "$BRANCH"
    
    # Pull latest changes
    print_status "Pulling from branch: $BRANCH"
    git pull origin "$BRANCH"
    
    # Check if deploy/build directory exists
    if [ ! -d "deploy/build" ]; then
        print_error "Deploy build directory not found: deploy/build"
        print_error "Please run the build script first to create the build"
        exit 1
    fi
    
    # Check if deploy/build has files
    if [ ! "$(ls -A deploy/build)" ]; then
        print_error "Deploy build directory is empty"
        exit 1
    fi
    
    print_success "Latest build pulled from git"
}

# Function to deploy build
deploy_build() {
    print_status "Deploying new build..."
    
    # Stop any running services that might be using the files
    if command -v pm2 >/dev/null 2>&1; then
        print_status "Gracefully stopping PM2 processes..."
        pm2 stop all 2>/dev/null || true
    fi
    
    # Remove old build directory
    if [ -d "$BUILD_DIR" ]; then
        sudo rm -rf "$BUILD_DIR"
    fi
    
    # Create WEBAPP directory if it doesn't exist
    sudo mkdir -p "$WEBAPP_DIR"
    
    # Copy new build from deploy directory
    sudo cp -r "$APP_DIR/deploy/build" "$BUILD_DIR"
    
    # Set correct ownership and permissions
    sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BUILD_DIR"
    sudo find "$BUILD_DIR" -type f -exec chmod 644 {} \;
    sudo find "$BUILD_DIR" -type d -exec chmod 755 {} \;
    
    # Copy deployment info if it exists
    if [ -f "$APP_DIR/deploy/deploy-info.json" ]; then
        sudo cp "$APP_DIR/deploy/deploy-info.json" "$WEBAPP_DIR/last-deploy-info.json"
        sudo chown "$DEPLOY_USER:$DEPLOY_USER" "$WEBAPP_DIR/last-deploy-info.json"
    fi
    
    # Update deployment timestamp
    echo "$(date -Iseconds)" | sudo tee "$WEBAPP_DIR/last-deployed" > /dev/null
    sudo chown "$DEPLOY_USER:$DEPLOY_USER" "$WEBAPP_DIR/last-deployed"
    
    print_success "Build deployed successfully"
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    
    # Restart PM2 processes
    if command -v pm2 >/dev/null 2>&1; then
        print_status "Starting PM2 processes..."
        pm2 start all 2>/dev/null || true
        pm2 restart all 2>/dev/null || true
    fi
    
    # Reload nginx
    if command -v nginx >/dev/null 2>&1; then
        print_status "Reloading nginx..."
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    print_success "Services restarted"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if build directory exists and has files
    if [ ! -d "$BUILD_DIR" ] || [ ! "$(ls -A "$BUILD_DIR")" ]; then
        print_error "Build directory is empty or doesn't exist"
        return 1
    fi
    
    # Check if index.html exists
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        print_error "index.html not found in build directory"
        return 1
    fi
    
    # Check if static assets exist
    if [ ! -d "$BUILD_DIR/static" ]; then
        print_warning "Static assets directory not found"
    fi
    
    # Test if nginx can serve the files
    if command -v curl >/dev/null 2>&1; then
        print_status "Testing web server response..."
        local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
        if [ "$response" = "200" ]; then
            print_success "Web server is responding correctly"
        else
            print_warning "Web server response: $response (may need manual check)"
        fi
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment info
show_deployment_info() {
    print_status "Deployment Information:"
    
    if [ -f "$WEBAPP_DIR/last-deploy-info.json" ]; then
        echo "----------------------------------------"
        cat "$WEBAPP_DIR/last-deploy-info.json" | python3 -m json.tool 2>/dev/null || cat "$WEBAPP_DIR/last-deploy-info.json"
        echo "----------------------------------------"
    fi
    
    if [ -f "$WEBAPP_DIR/last-deployed" ]; then
        echo "Last deployed: $(cat "$WEBAPP_DIR/last-deployed")"
    fi
    
    if [ -d "$BUILD_DIR" ]; then
        echo "Build directory size: $(du -sh "$BUILD_DIR" | cut -f1)"
        echo "Build file count: $(find "$BUILD_DIR" -type f | wc -l)"
    fi
    
    # Show git info
    cd "$APP_DIR"
    echo "Current git commit: $(git rev-parse HEAD)"
    echo "Current git branch: $(git branch --show-current)"
}

# Main execution
main() {
    print_status "Starting simple server deployment process..."
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup of current build
    backup_current_build
    
    # Pull latest build from git
    pull_latest_build
    
    # Deploy build
    deploy_build
    
    # Restart services
    restart_services
    
    # Verify deployment
    if verify_deployment; then
        print_success "Deployment completed successfully!"
    else
        print_warning "Deployment completed with warnings"
    fi
    
    # Show deployment info
    show_deployment_info
    
    print_success "Simple server deployment process completed!"
}

# Handle script arguments
case "${1:-}" in
    --branch|-b)
        BRANCH="$2"
        shift 2
        ;;
    --help|-h)
        echo "Usage: $0 [--branch|-b BRANCH_NAME]"
        echo ""
        echo "Options:"
        echo "  --branch, -b    Specify git branch to deploy from (default: main)"
        echo "  --help, -h      Show this help message"
        exit 0
        ;;
esac

# Run main function
main "$@" 