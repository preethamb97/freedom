#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_NAME="encrypted-data-ui-local"
COMPOSE_FILE="docker-compose.local.yml"

# Function to display help
show_help() {
    echo -e "${BLUE}🐳 Encrypted Data UI - Local Development Docker Script${NC}"
    echo ""
    echo -e "${CYAN}Usage:${NC}"
    echo "  ./local-deploy.sh [COMMAND]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  up                - Start all services"
    echo "  down              - Stop all services"
    echo "  restart           - Restart all services"
    echo "  build             - Build all images"
    echo "  clean             - Clean containers and volumes"
    echo "  clean-all         - Clean everything including images"
    echo "  status            - Show service status"
    echo "  logs [service]    - Show logs (all or specific service)"
    echo "  health            - Check application health"
    echo "  compass           - Instructions to connect to MongoDB Atlas"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  ./local-deploy.sh up              # Start local environment with hot reloading"
    echo "  ./local-deploy.sh logs api-local  # Show API logs"
    echo "  ./local-deploy.sh db              # Connect to database"
    echo "  ./local-deploy.sh clean           # Clean local resources"
    echo ""
    echo -e "${CYAN}Services and Ports:${NC}"
    echo "  Frontend:  http://localhost:3000"
    echo "  API:       http://localhost:3001"
    echo "  Nginx:     http://localhost:8080"
    echo "  MongoDB:   Use MongoDB Compass with your MONGODB_URI"
    echo ""
    echo -e "${CYAN}🔥 Hot Reloading:${NC}"
    echo "  - Frontend: Automatically reloads on file changes in ./WEBAPP/"
    echo "  - API: Automatically restarts on file changes in ./API/"
    echo "  - Both services use volume mounts for real-time development"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to check if Docker Compose file exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Docker Compose file not found: $COMPOSE_FILE${NC}"
        exit 1
    fi
}

# Function to create local environment files
create_local_env() {
    if [ ! -f API/.env ]; then
        echo -e "${YELLOW}📝 Creating API environment file...${NC}"
        cp API/env.example API/.env
        echo -e "${GREEN}✅ Created API/.env file${NC}"
        echo -e "${YELLOW}Please update database and Firebase configuration in API/.env${NC}"
    fi
    
    if [ ! -f WEBAPP/.env ]; then
        echo -e "${YELLOW}📝 Creating WEBAPP environment file...${NC}"
        cp WEBAPP/env.example WEBAPP/.env
        echo -e "${GREEN}✅ Created WEBAPP/.env file${NC}"
        echo -e "${YELLOW}Please update Firebase configuration in WEBAPP/.env${NC}"
    fi
}

# Function to clean local Docker resources
clean_local() {
    echo -e "${YELLOW}🧹 Cleaning local Docker resources...${NC}"
    
    # Stop and remove containers
    echo -e "${BLUE}Stopping local containers...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans 2>/dev/null || true
    
    # Remove project-specific containers
    CONTAINERS=$(docker ps -a --filter "name=${PROJECT_NAME}" -q)
    if [ ! -z "$CONTAINERS" ]; then
        echo -e "${BLUE}Removing local containers...${NC}"
        docker rm -f $CONTAINERS
    fi
    
    # Remove project volumes
    echo -e "${BLUE}Removing local volumes...${NC}"
    docker volume ls --filter "name=${PROJECT_NAME}" -q | xargs -r docker volume rm
    
    # Remove project networks
    echo -e "${BLUE}Removing local networks...${NC}"
    docker network ls --filter "name=${PROJECT_NAME}" -q | xargs -r docker network rm 2>/dev/null || true
    
    echo -e "${GREEN}✅ Local cleanup completed${NC}"
}

# Function to deep clean local Docker (including images)
clean_all_local() {
    echo -e "${YELLOW}🧹 Deep cleaning local Docker resources...${NC}"
    echo -e "${RED}⚠️  This will remove local images and all project resources!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        clean_local
        
        # Remove project images
        IMAGES=$(docker images --filter "reference=*${PROJECT_NAME}*" -q)
        if [ ! -z "$IMAGES" ]; then
            echo -e "${BLUE}Removing local images...${NC}"
            docker rmi -f $IMAGES
        fi
        
        # Remove related images
        LOCAL_IMAGES=$(docker images --filter "reference=encrypted-data-ui*" -q)
        if [ ! -z "$LOCAL_IMAGES" ]; then
            echo -e "${BLUE}Removing project images...${NC}"
            docker rmi -f $LOCAL_IMAGES 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ Deep local cleanup completed${NC}"
    else
        echo -e "${YELLOW}Deep clean cancelled${NC}"
    fi
}

# Function to build local images
build_local() {
    echo -e "${BLUE}🔨 Building local Docker images...${NC}"
    check_compose_file
    
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Local images built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build local images${NC}"
        exit 1
    fi
}

# Function to start local environment
start_local() {
    echo -e "${BLUE}🚀 Starting local development environment...${NC}"
    
    check_compose_file
    create_local_env
    
    # Clean previous instances
    echo -e "${YELLOW}Cleaning previous instances...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans 2>/dev/null || true
    
    # Start the environment
    echo -e "${BLUE}Starting local services...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Local environment started successfully${NC}"
        echo ""
        show_status
        echo ""
        echo -e "${CYAN}🌐 Local Development URLs:${NC}"
        echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC} (Hot reloading enabled)"
        echo -e "  API:       ${GREEN}http://localhost:3001${NC} (Hot reloading enabled)"
        echo -e "  Health:    ${GREEN}http://localhost:3001/api/health${NC}"
        echo -e "  Nginx:     ${GREEN}http://localhost:8080${NC}"
        echo -e "  MongoDB:   ${GREEN}Use MongoDB Compass with your MONGODB_URI${NC}"
        echo ""
        echo -e "${CYAN}🔥 Hot Reloading Features:${NC}"
        echo -e "  - ${YELLOW}Frontend${NC}: Changes in ./WEBAPP/ auto-reload browser"
        echo -e "  - ${YELLOW}API${NC}: Changes in ./API/ auto-restart server"
        echo -e "  - ${YELLOW}WebSocket${NC}: Real-time updates supported via nginx"
        echo ""
        echo -e "${YELLOW}Database Credentials:${NC}"
        echo -e "  Username: ${GREEN}localuser${NC}"
        echo -e "  Password: ${GREEN}localpassword${NC}"
        echo -e "  Database: ${GREEN}encrypted_data_app${NC}"
        echo ""
        echo -e "${YELLOW}Use './local-deploy.sh logs' to view logs${NC}"
        echo -e "${YELLOW}Use './local-deploy.sh down' to stop the environment${NC}"
    else
        echo -e "${RED}❌ Failed to start local environment${NC}"
        echo -e "${YELLOW}Run './local-deploy.sh logs' to see what went wrong${NC}"
        exit 1
    fi
}

# Function to stop local environment
stop_local() {
    echo -e "${YELLOW}🛑 Stopping local development environment...${NC}"
    
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down --remove-orphans
    
    echo -e "${GREEN}✅ Local environment stopped${NC}"
}

# Function to restart local environment
restart_local() {
    echo -e "${PURPLE}🔄 Restarting local development environment...${NC}"
    
    stop_local
    sleep 2
    start_local
}

# Function to show local environment status
show_status() {
    echo -e "${CYAN}📊 Local Environment Status:${NC}"
    echo ""
    
    # Show container status
    CONTAINERS=$(docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    if [ ! -z "$CONTAINERS" ]; then
        echo -e "${GREEN}Running Containers:${NC}"
        echo "$CONTAINERS"
    else
        echo -e "${YELLOW}No local containers running${NC}"
    fi
    
    echo ""
    
    # Show volumes
    VOLUMES=$(docker volume ls --filter "name=${PROJECT_NAME}" --format "table {{.Name}}\t{{.Driver}}")
    if [ ! -z "$VOLUMES" ]; then
        echo -e "${GREEN}Local Volumes:${NC}"
        echo "$VOLUMES"
    fi
    
    echo ""
    
    # Show networks
    NETWORKS=$(docker network ls --filter "name=${PROJECT_NAME}" --format "table {{.Name}}\t{{.Driver}}")
    if [ ! -z "$NETWORKS" ]; then
        echo -e "${GREEN}Local Networks:${NC}"
        echo "$NETWORKS"
    fi
}

# Function to show logs
show_logs() {
    local SERVICE=$1
    
    if [ ! -z "$SERVICE" ]; then
        echo -e "${CYAN}📋 Showing logs for ${SERVICE}...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f $SERVICE
    else
        echo -e "${CYAN}📋 Showing all local environment logs...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    fi
}

# Function to check local environment health
health_check() {
    echo -e "${CYAN}🏥 Checking local environment health...${NC}"
    echo ""
    
    # Check API health
    echo -e "${BLUE}Checking API...${NC}"
    if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is responding${NC}"
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi
    
    # Check Frontend
    echo -e "${BLUE}Checking Frontend...${NC}"
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is responding${NC}"
    else
        echo -e "${RED}❌ Frontend is not responding${NC}"
    fi
    
    # Check MongoDB Atlas connection via API health endpoint
    echo -e "${BLUE}Checking MongoDB Atlas connection...${NC}"
    API_HEALTH=$(curl -f -s http://localhost:3001/api/health 2>/dev/null)
    if echo "$API_HEALTH" | grep -q '"status":"OK"'; then
        echo -e "${GREEN}✅ MongoDB Atlas connection is healthy${NC}"
    else
        echo -e "${RED}❌ MongoDB Atlas connection issue (check API logs)${NC}"
    fi
    
    echo ""
    show_status
}

# Function to show MongoDB Compass connection info
mongodb_compass_info() {
    echo -e "${CYAN}🍃 MongoDB Atlas Connection Instructions${NC}"
    echo ""
    echo -e "${BLUE}To connect to your MongoDB Atlas database:${NC}"
    echo ""
    echo -e "${YELLOW}1. Download MongoDB Compass:${NC}"
    echo "   https://www.mongodb.com/products/compass"
    echo ""
    echo -e "${YELLOW}2. Get your connection string from API/.env:${NC}"
    echo "   MONGODB_URI=mongodb+srv://..."
    echo ""
    echo -e "${YELLOW}3. Open MongoDB Compass and paste the connection string${NC}"
    echo ""
    echo -e "${YELLOW}4. Click 'Connect' to browse your database${NC}"
    echo ""
    echo -e "${GREEN}Your MongoDB Atlas database is cloud-hosted and accessible from anywhere!${NC}"
}

# Main script logic
case "${1:-help}" in
    "up")
        check_docker
        start_local
        ;;
    "down")
        check_docker
        stop_local
        ;;
    "restart")
        check_docker
        restart_local
        ;;
    "clean")
        check_docker
        clean_local
        ;;
    "clean-all")
        check_docker
        clean_all_local
        ;;
    "status")
        check_docker
        show_status
        ;;
    "logs")
        check_docker
        show_logs $2
        ;;
    "build")
        check_docker
        build_local
        ;;
    "health")
        check_docker
        health_check
        ;;
    "compass")
        mongodb_compass_info
        ;;
    "help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac 