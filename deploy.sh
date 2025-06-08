#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_NAME="encrypted-data-ui"

# Function to display help
show_help() {
    echo -e "${BLUE}🐳 Encrypted Data UI - Docker Deployment Script${NC}"
    echo ""
    echo -e "${CYAN}Usage:${NC}"
    echo "  ./deploy.sh [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  up [prod|dev]     - Start the application (default: prod)"
    echo "  down              - Stop the application"
    echo "  restart [prod|dev] - Restart the application"
    echo "  clean             - Clean all Docker resources"
    echo "  clean-all         - Deep clean all Docker resources (including images)"
    echo "  status            - Show application status"
    echo "  logs [service]    - Show logs (optional: specify service)"
    echo "  build             - Build Docker images"
    echo "  health            - Check application health"
    echo "  help              - Show this help message"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  ./deploy.sh up              # Start in production mode"
    echo "  ./deploy.sh up dev          # Start in development mode"
    echo "  ./deploy.sh clean           # Clean Docker resources"
    echo "  ./deploy.sh logs api        # Show API logs"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found!${NC}"
        echo -e "${YELLOW}Please run ./setup.sh first or copy env.example to .env${NC}"
        exit 1
    fi
}

# Function to clean Docker resources
clean_docker() {
    echo -e "${YELLOW}🧹 Cleaning Docker resources for ${PROJECT_NAME}...${NC}"
    
    # Stop and remove containers
    echo -e "${BLUE}Stopping containers...${NC}"
    docker-compose -p ${PROJECT_NAME} down --remove-orphans 2>/dev/null || true
    
    # Remove project-specific containers
    CONTAINERS=$(docker ps -a --filter "name=${PROJECT_NAME}" -q)
    if [ ! -z "$CONTAINERS" ]; then
        echo -e "${BLUE}Removing project containers...${NC}"
        docker rm -f $CONTAINERS
    fi
    
    # Remove project volumes
    echo -e "${BLUE}Removing project volumes...${NC}"
    docker volume ls --filter "name=${PROJECT_NAME}" -q | xargs -r docker volume rm
    
    # Remove dangling volumes
    VOLUMES=$(docker volume ls -qf dangling=true)
    if [ ! -z "$VOLUMES" ]; then
        echo -e "${BLUE}Removing dangling volumes...${NC}"
        docker volume rm $VOLUMES 2>/dev/null || true
    fi
    
    # Remove unused networks
    echo -e "${BLUE}Removing unused networks...${NC}"
    docker network prune -f
    
    echo -e "${GREEN}✅ Basic cleanup completed${NC}"
}

# Function to deep clean Docker (including images)
clean_all_docker() {
    echo -e "${YELLOW}🧹 Deep cleaning ALL Docker resources...${NC}"
    echo -e "${RED}⚠️  This will remove ALL unused Docker resources system-wide!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        clean_docker
        
        # Remove project images
        IMAGES=$(docker images --filter "reference=*${PROJECT_NAME}*" -q)
        if [ ! -z "$IMAGES" ]; then
            echo -e "${BLUE}Removing project images...${NC}"
            docker rmi -f $IMAGES
        fi
        
        # System prune
        echo -e "${BLUE}Running system prune...${NC}"
        docker system prune -af --volumes
        
        echo -e "${GREEN}✅ Deep cleanup completed${NC}"
    else
        echo -e "${YELLOW}Deep clean cancelled${NC}"
    fi
}

# Function to build images
build_images() {
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    check_env
    
    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Images built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build images${NC}"
        exit 1
    fi
}

# Function to start the application
start_app() {
    local MODE=${1:-prod}
    echo -e "${BLUE}🚀 Starting Encrypted Data UI in ${MODE} mode...${NC}"
    
    check_env
    
    # Clean previous instances
    echo -e "${YELLOW}Cleaning previous instances...${NC}"
    docker-compose -p ${PROJECT_NAME} down --remove-orphans 2>/dev/null || true
    
    # Start the application
    if [ "$MODE" = "dev" ]; then
        echo -e "${BLUE}Starting in development mode...${NC}"
        docker-compose -p ${PROJECT_NAME} -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    else
        echo -e "${BLUE}Starting in production mode...${NC}"
        docker-compose -p ${PROJECT_NAME} up -d --build
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Application started successfully${NC}"
        echo ""
        show_status
        echo ""
        echo -e "${CYAN}🌐 Application URLs:${NC}"
        echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
        echo -e "  API:      ${GREEN}http://localhost:3001${NC}"
        echo -e "  Health:   ${GREEN}http://localhost:3001/api/health${NC}"
        if [ "$MODE" = "prod" ]; then
            echo -e "  Nginx:    ${GREEN}http://localhost${NC}"
        fi
        echo ""
        echo -e "${YELLOW}Use './deploy.sh logs' to view logs${NC}"
        echo -e "${YELLOW}Use './deploy.sh down' to stop the application${NC}"
    else
        echo -e "${RED}❌ Failed to start application${NC}"
        echo -e "${YELLOW}Run './deploy.sh logs' to see what went wrong${NC}"
        exit 1
    fi
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}🛑 Stopping Encrypted Data UI...${NC}"
    
    docker-compose -p ${PROJECT_NAME} down --remove-orphans
    
    # Also try with dev compose file
    docker-compose -p ${PROJECT_NAME} -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    
    echo -e "${GREEN}✅ Application stopped${NC}"
}

# Function to restart the application
restart_app() {
    local MODE=${1:-prod}
    echo -e "${PURPLE}🔄 Restarting Encrypted Data UI...${NC}"
    
    stop_app
    sleep 2
    start_app $MODE
}

# Function to show application status
show_status() {
    echo -e "${CYAN}📊 Application Status:${NC}"
    echo ""
    
    # Show container status
    CONTAINERS=$(docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    if [ ! -z "$CONTAINERS" ]; then
        echo -e "${GREEN}Running Containers:${NC}"
        echo "$CONTAINERS"
    else
        echo -e "${YELLOW}No containers running${NC}"
    fi
    
    echo ""
    
    # Show volumes
    VOLUMES=$(docker volume ls --filter "name=${PROJECT_NAME}" --format "table {{.Name}}\t{{.Driver}}")
    if [ ! -z "$VOLUMES" ]; then
        echo -e "${GREEN}Project Volumes:${NC}"
        echo "$VOLUMES"
    fi
    
    echo ""
    
    # Show networks
    NETWORKS=$(docker network ls --filter "name=${PROJECT_NAME}" --format "table {{.Name}}\t{{.Driver}}")
    if [ ! -z "$NETWORKS" ]; then
        echo -e "${GREEN}Project Networks:${NC}"
        echo "$NETWORKS"
    fi
}

# Function to show logs
show_logs() {
    local SERVICE=$1
    
    if [ ! -z "$SERVICE" ]; then
        echo -e "${CYAN}📋 Showing logs for ${SERVICE}...${NC}"
        docker-compose -p ${PROJECT_NAME} logs -f $SERVICE
    else
        echo -e "${CYAN}📋 Showing all application logs...${NC}"
        docker-compose -p ${PROJECT_NAME} logs -f
    fi
}

# Function to check application health
check_health() {
    echo -e "${CYAN}🏥 Checking application health...${NC}"
    echo ""
    
    # Check API health
    echo -e "${BLUE}Checking API health...${NC}"
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi
    
    # Check Frontend
    echo -e "${BLUE}Checking Frontend...${NC}"
    if curl -f -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${RED}❌ Frontend is not accessible${NC}"
    fi
    
    # Check Database connection via API health endpoint
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

# Main script logic
case "${1:-help}" in
    "up")
        check_docker
        start_app ${2:-prod}
        ;;
    "down")
        check_docker
        stop_app
        ;;
    "restart")
        check_docker
        restart_app ${2:-prod}
        ;;
    "clean")
        check_docker
        clean_docker
        ;;
    "clean-all")
        check_docker
        clean_all_docker
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
        build_images $2
        ;;
    "health")
        check_health
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac 