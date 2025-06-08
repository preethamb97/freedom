#!/bin/bash

# 🏴‍☠️ Freedom - Encrypted Data Storage Setup Script
# Inspired by Monkey D. Luffy's determination to sail the Grand Line!
# "I don't want to conquer anything. I just think the guy with the most freedom in this whole ocean... is the Pirate King!"

echo "🏴‍☠️ Welcome to Freedom - Your Encrypted Data Treasure Vault! 🏴‍☠️"
echo ""
echo "⚡ Gear 5 - Setup Mode Activated! ⚡"
echo "🌊 Setting sail to configure your digital ship... 🌊"
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[⚓]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

print_luffy() {
    echo -e "${PURPLE}[🏴‍☠️]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking if Docker is aboard your ship..."
    if command -v docker &> /dev/null; then
        print_success "Docker found! Your ship is seaworthy!"
    else
        print_error "Docker not found! Please install Docker first:"
        echo "  🌊 Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    print_status "Checking for Docker Compose navigation tools..."
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose found! Ready to orchestrate your crew!"
    elif docker compose version &> /dev/null; then
        print_success "Docker Compose (V2) found! Modern navigation tools ready!"
        alias docker-compose='docker compose'
    else
        print_error "Docker Compose not found! Please install Docker Compose:"
        echo "  🌊 Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# Create environment files
setup_environment() {
    print_luffy "Setting up your treasure maps (environment files)..."
    
    # API Environment
    if [ ! -f "API/.env" ]; then
        print_status "Creating API environment file..."
        if [ -f "API/env.example" ]; then
            cp API/env.example API/.env
            print_success "API .env created from example!"
            print_warning "⚠️  IMPORTANT: Edit API/.env with your actual MongoDB URI and Google OAuth credentials!"
        else
            print_error "API/env.example not found!"
        fi
    else
        print_success "API .env already exists!"
    fi

    # WEBAPP Environment
    if [ ! -f "WEBAPP/.env" ]; then
        print_status "Creating WEBAPP environment file..."
        cat > WEBAPP/.env << EOF
# 🌊 Freedom Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
EOF
        print_success "WEBAPP .env created!"
        print_warning "⚠️  IMPORTANT: Edit WEBAPP/.env with your actual Google OAuth and Firebase credentials!"
    else
        print_success "WEBAPP .env already exists!"
    fi
}

# Build and start services
start_services() {
    print_luffy "🚢 Launching the Thousand Sunny (your services)!"
    print_status "Building and starting Docker containers..."
    
    # Stop any existing containers
    print_status "Stopping any existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Build and start with simplified configuration
    print_status "Building images..."
    if docker-compose build; then
        print_success "Images built successfully!"
    else
        print_error "Failed to build images!"
        exit 1
    fi
    
    print_status "Starting services..."
    if docker-compose up -d; then
        print_success "Services started successfully!"
    else
        print_error "Failed to start services!"
        exit 1
    fi
}

# Check service health
check_services() {
    print_luffy "🔍 Checking if your crew is ready for adventure..."
    
    # Wait a bit for services to start
    sleep 5
    
    # Check API health
    print_status "Checking API (Backend crew)..."
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "API is healthy and ready!"
    else
        print_warning "API might still be starting up..."
    fi
    
    # Check Frontend
    print_status "Checking Frontend (Navigation crew)..."
    if curl -f http://localhost:5001 > /dev/null 2>&1; then
        print_success "Frontend is ready for adventure!"
    else
        print_warning "Frontend might still be starting up..."
    fi
}

# Display final information
show_completion() {
    echo ""
    echo "🏴‍☠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🏴‍☠️"
    echo ""
    print_luffy "⚡ GEAR 5 - SETUP COMPLETE! Your Freedom ship is ready to sail! ⚡"
    echo ""
    print_success "🌊 Frontend (Your treasure map): http://localhost:5001"
    print_success "⚡ API (Your crew headquarters): http://localhost:5000"
    print_success "🔍 Health Check: http://localhost:5000/api/health"
    echo ""
    print_warning "📋 Next Steps:"
    echo "   1. Edit API/.env with your MongoDB Atlas URI"
    echo "   2. Edit API/.env with your Google OAuth credentials"
    echo "   3. Edit WEBAPP/.env with your frontend configuration"
    echo "   4. Restart services: docker-compose restart"
    echo ""
    print_luffy "🎯 Useful Commands:"
    echo "   • View logs: docker-compose logs -f"
    echo "   • Stop services: docker-compose down"
    echo "   • Restart: docker-compose restart"
    echo "   • Rebuild: docker-compose up -d --build"
    echo ""
    print_luffy "\"The sea is vast and full of possibilities!\""
    print_luffy "Set sail with Freedom and protect your digital treasures! 🏴‍☠️"
    echo ""
    echo "🏴‍☠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🏴‍☠️"
}

# Main execution
main() {
    print_luffy "🌊 Starting Freedom setup adventure! 🌊"
    echo ""
    
    check_docker
    check_docker_compose
    setup_environment
    start_services
    check_services
    show_completion
}

# Run the setup
main 