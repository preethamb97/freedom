#!/bin/bash

# Simple Build and Deploy Script for Encrypted Data UI
# This script builds the webapp and puts it in deploy/build folder for git

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="WEBAPP/build"
DEPLOY_DIR="deploy"
DEPLOY_BUILD_DIR="$DEPLOY_DIR/build"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Function to clean previous builds
clean_previous_builds() {
    print_status "Cleaning previous builds..."
    
    # Clean webapp build directory
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_success "Cleaned webapp build directory"
    fi
    
    # Clean deploy build directory
    if [ -d "$DEPLOY_BUILD_DIR" ]; then
        rm -rf "$DEPLOY_BUILD_DIR"
        print_success "Cleaned deploy build directory"
    fi
    
    # Create deploy directory if it doesn't exist
    mkdir -p "$DEPLOY_DIR"
}

# Function to build webapp
build_webapp() {
    print_status "Building React webapp..."
    
    cd WEBAPP
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing webapp dependencies..."
        npm ci
    fi
    
    # Build the app
    print_status "Building production webapp..."
    npm run build
    
    if [ ! -d "build" ]; then
        print_error "Build failed - build directory not found"
        exit 1
    fi
    
    cd ..
    print_success "Webapp built successfully"
}

# Function to optimize build (remove unnecessary files)
optimize_build() {
    print_status "Optimizing build files..."
    
    # Remove source maps in production (optional - comment if you need them)
    find "$BUILD_DIR" -name "*.map" -type f -delete 2>/dev/null || true
    
    # Remove unnecessary files
    find "$BUILD_DIR" -name ".DS_Store" -type f -delete 2>/dev/null || true
    find "$BUILD_DIR" -name "Thumbs.db" -type f -delete 2>/dev/null || true
    
    print_success "Build optimized"
}

# Function to copy build to deploy folder
copy_build_to_deploy() {
    print_status "Copying build to deploy folder..."
    
    # Copy build directory to deploy
    cp -r "$BUILD_DIR" "$DEPLOY_BUILD_DIR"
    
    local build_size=$(du -sh "$DEPLOY_BUILD_DIR" | cut -f1)
    print_success "Build copied to deploy folder"
    print_status "Build size: $build_size"
}

# Function to create deployment info
create_deploy_info() {
    print_status "Creating deployment info..."
    
    cat > "$DEPLOY_DIR/deploy-info.json" << EOF
{
  "build_timestamp": "$TIMESTAMP",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "build_size": "$(du -sh "$DEPLOY_BUILD_DIR" | cut -f1)",
  "build_files": "$(find "$DEPLOY_BUILD_DIR" -type f | wc -l)",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)"
}
EOF
    
    print_success "Deployment info created"
}

# Function to commit and push to git
push_to_git() {
    print_status "Committing and pushing to git..."
    
    # Add files to git
    git add "$DEPLOY_DIR/"
    
    # Create commit message
    local commit_msg="chore: deploy webapp build $TIMESTAMP"
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Commit and push
    git commit -m "$commit_msg"
    
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    # Push to remote
    if git remote | grep -q origin; then
        git push origin "$current_branch"
        print_success "Pushed to git successfully"
    else
        print_warning "No git remote 'origin' found. Please push manually."
    fi
}

# Main execution
main() {
    print_status "Starting simple build and deploy process..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "WEBAPP" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Clean previous builds
    clean_previous_builds
    
    # Build webapp
    build_webapp
    
    # Optimize build
    optimize_build
    
    # Copy build to deploy folder
    copy_build_to_deploy
    
    # Create deployment info
    create_deploy_info
    
    # Push to git
    push_to_git
    
    print_success "Build and deploy process completed successfully!"
    print_status "Build location: $DEPLOY_BUILD_DIR"
    print_status "You can now pull on the server and run the simple deployment script."
}

# Run main function
main "$@" 