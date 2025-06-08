#!/bin/bash

# Docker Complete Cleanup Script
# WARNING: This script can remove ALL Docker resources!

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_NAME="Docker Complete Cleanup"
VERSION="1.0.0"

# Function to display banner
show_banner() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${WHITE}                    🐳 Docker Complete Cleanup                   ${BLUE}║${NC}"
    echo -e "${BLUE}║${WHITE}                          Version ${VERSION}                          ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to display help
show_help() {
    show_banner
    echo -e "${CYAN}Usage:${NC}"
    echo "  ./clean-docker.sh [OPTION]"
    echo ""
    echo -e "${CYAN}Options:${NC}"
    echo "  --all           Complete cleanup (removes EVERYTHING)"
    echo "  --containers    Remove all containers (running and stopped)"
    echo "  --images        Remove all images"
    echo "  --volumes       Remove all volumes"
    echo "  --networks      Remove all custom networks"
    echo "  --system        System prune (removes unused resources)"
    echo "  --cache         Remove build cache"
    echo "  --project       Remove project-specific resources only"
    echo "  --dry-run       Show what would be removed (no actual deletion)"
    echo "  --force         Skip all confirmation prompts"
    echo "  --help          Show this help message"
    echo ""
    echo -e "${CYAN}Cleanup Levels:${NC}"
    echo "  ${GREEN}Light${NC}    - Remove stopped containers and unused images"
    echo "  ${YELLOW}Medium${NC}   - Remove all containers, unused images, and volumes"
    echo "  ${RED}Heavy${NC}    - Remove EVERYTHING (containers, images, volumes, networks)"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  ./clean-docker.sh --dry-run      # See what would be removed"
    echo "  ./clean-docker.sh --system       # Safe cleanup of unused resources"
    echo "  ./clean-docker.sh --all --force  # Nuclear option (no prompts)"
    echo "  ./clean-docker.sh --project      # Clean only this project's resources"
    echo ""
    echo -e "${RED}⚠️  WARNING: ${NC}Use with caution! This can remove ALL Docker data!"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to confirm action
confirm_action() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$FORCE_MODE" = true ]; then
        echo -e "${YELLOW}⚡ Force mode: Skipping confirmation for: $message${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}⚠️  $message${NC}"
    if [ "$default" = "y" ]; then
        read -p "Continue? (Y/n): " -n 1 -r
        echo
        [[ $REPLY =~ ^[Nn]$ ]] && return 1 || return 0
    else
        read -p "Continue? (y/N): " -n 1 -r
        echo
        [[ $REPLY =~ ^[Yy]$ ]] && return 0 || return 1
    fi
}

# Function to show Docker resource summary
show_docker_summary() {
    echo -e "${CYAN}📊 Current Docker Resources:${NC}"
    echo ""
    
    # Containers
    RUNNING_CONTAINERS=$(docker ps -q | wc -l)
    STOPPED_CONTAINERS=$(docker ps -aq | wc -l)
    TOTAL_CONTAINERS=$((RUNNING_CONTAINERS + STOPPED_CONTAINERS))
    echo -e "  ${GREEN}Containers:${NC} $TOTAL_CONTAINERS total ($RUNNING_CONTAINERS running, $((STOPPED_CONTAINERS - RUNNING_CONTAINERS)) stopped)"
    
    # Images
    TOTAL_IMAGES=$(docker images -q | wc -l)
    DANGLING_IMAGES=$(docker images -f "dangling=true" -q | wc -l)
    echo -e "  ${GREEN}Images:${NC} $TOTAL_IMAGES total ($DANGLING_IMAGES dangling)"
    
    # Volumes
    TOTAL_VOLUMES=$(docker volume ls -q | wc -l)
    DANGLING_VOLUMES=$(docker volume ls -f "dangling=true" -q | wc -l)
    echo -e "  ${GREEN}Volumes:${NC} $TOTAL_VOLUMES total ($DANGLING_VOLUMES dangling)"
    
    # Networks
    TOTAL_NETWORKS=$(docker network ls -q | wc -l)
    CUSTOM_NETWORKS=$((TOTAL_NETWORKS - 3)) # Exclude default bridge, host, none
    echo -e "  ${GREEN}Networks:${NC} $TOTAL_NETWORKS total ($CUSTOM_NETWORKS custom)"
    
    # System info
    echo ""
    echo -e "${CYAN}💾 Disk Usage:${NC}"
    docker system df 2>/dev/null || echo "  Unable to get disk usage info"
    echo ""
}

# Function to stop all containers
stop_all_containers() {
    echo -e "${BLUE}🛑 Stopping all running containers...${NC}"
    
    RUNNING=$(docker ps -q)
    if [ ! -z "$RUNNING" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN] Would stop containers:${NC}"
            docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
        else
            docker stop $RUNNING
            echo -e "${GREEN}✅ Stopped all running containers${NC}"
        fi
    else
        echo -e "${YELLOW}No running containers found${NC}"
    fi
}

# Function to remove all containers
remove_all_containers() {
    echo -e "${BLUE}🗑️  Removing all containers...${NC}"
    
    ALL_CONTAINERS=$(docker ps -aq)
    if [ ! -z "$ALL_CONTAINERS" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN] Would remove containers:${NC}"
            docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
        else
            docker rm -f $ALL_CONTAINERS
            echo -e "${GREEN}✅ Removed all containers${NC}"
        fi
    else
        echo -e "${YELLOW}No containers found${NC}"
    fi
}

# Function to remove all images
remove_all_images() {
    echo -e "${BLUE}🗑️  Removing all images...${NC}"
    
    ALL_IMAGES=$(docker images -aq)
    if [ ! -z "$ALL_IMAGES" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN] Would remove images:${NC}"
            docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
        else
            docker rmi -f $ALL_IMAGES
            echo -e "${GREEN}✅ Removed all images${NC}"
        fi
    else
        echo -e "${YELLOW}No images found${NC}"
    fi
}

# Function to remove all volumes
remove_all_volumes() {
    echo -e "${BLUE}🗑️  Removing all volumes...${NC}"
    
    ALL_VOLUMES=$(docker volume ls -q)
    if [ ! -z "$ALL_VOLUMES" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN] Would remove volumes:${NC}"
            docker volume ls
        else
            docker volume rm $ALL_VOLUMES 2>/dev/null || echo -e "${YELLOW}Some volumes may be in use${NC}"
            echo -e "${GREEN}✅ Removed all volumes${NC}"
        fi
    else
        echo -e "${YELLOW}No volumes found${NC}"
    fi
}

# Function to remove custom networks
remove_custom_networks() {
    echo -e "${BLUE}🗑️  Removing custom networks...${NC}"
    
    CUSTOM_NETWORKS=$(docker network ls --filter "type=custom" -q)
    if [ ! -z "$CUSTOM_NETWORKS" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN] Would remove networks:${NC}"
            docker network ls --filter "type=custom"
        else
            docker network rm $CUSTOM_NETWORKS 2>/dev/null || echo -e "${YELLOW}Some networks may be in use${NC}"
            echo -e "${GREEN}✅ Removed custom networks${NC}"
        fi
    else
        echo -e "${YELLOW}No custom networks found${NC}"
    fi
}

# Function to clean build cache
clean_build_cache() {
    echo -e "${BLUE}🗑️  Cleaning build cache...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would clean build cache${NC}"
        docker system df
    else
        docker builder prune -af
        echo -e "${GREEN}✅ Cleaned build cache${NC}"
    fi
}

# Function to system prune
system_prune() {
    echo -e "${BLUE}🧹 Running system prune...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would run system prune${NC}"
        docker system df
    else
        docker system prune -af --volumes
        echo -e "${GREEN}✅ System prune completed${NC}"
    fi
}

# Function to remove project-specific resources
remove_project_resources() {
    echo -e "${BLUE}🗑️  Removing project-specific resources...${NC}"
    
    PROJECT_PATTERNS=("encrypted-data-ui" "encrypted_data_app")
    
    for pattern in "${PROJECT_PATTERNS[@]}"; do
        echo -e "${CYAN}Cleaning resources matching: $pattern${NC}"
        
        # Remove containers
        CONTAINERS=$(docker ps -aq --filter "name=$pattern")
        if [ ! -z "$CONTAINERS" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}[DRY RUN] Would remove containers:${NC}"
                docker ps -a --filter "name=$pattern" --format "table {{.Names}}\t{{.Image}}"
            else
                docker rm -f $CONTAINERS
            fi
        fi
        
        # Remove images
        IMAGES=$(docker images --filter "reference=*$pattern*" -q)
        if [ ! -z "$IMAGES" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}[DRY RUN] Would remove images:${NC}"
                docker images --filter "reference=*$pattern*"
            else
                docker rmi -f $IMAGES 2>/dev/null || true
            fi
        fi
        
        # Remove volumes
        VOLUMES=$(docker volume ls --filter "name=$pattern" -q)
        if [ ! -z "$VOLUMES" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}[DRY RUN] Would remove volumes:${NC}"
                docker volume ls --filter "name=$pattern"
            else
                docker volume rm $VOLUMES 2>/dev/null || true
            fi
        fi
        
        # Remove networks
        NETWORKS=$(docker network ls --filter "name=$pattern" -q)
        if [ ! -z "$NETWORKS" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "${YELLOW}[DRY RUN] Would remove networks:${NC}"
                docker network ls --filter "name=$pattern"
            else
                docker network rm $NETWORKS 2>/dev/null || true
            fi
        fi
    done
    
    if [ "$DRY_RUN" != true ]; then
        echo -e "${GREEN}✅ Project resources cleaned${NC}"
    fi
}

# Function for complete cleanup
complete_cleanup() {
    echo -e "${RED}☢️  NUCLEAR CLEANUP: This will remove EVERYTHING!${NC}"
    echo -e "${RED}This includes:${NC}"
    echo -e "${RED}  • All containers (running and stopped)${NC}"
    echo -e "${RED}  • All images${NC}"
    echo -e "${RED}  • All volumes (DATA WILL BE LOST!)${NC}"
    echo -e "${RED}  • All custom networks${NC}"
    echo -e "${RED}  • All build cache${NC}"
    echo ""
    
    if ! confirm_action "This will PERMANENTLY DELETE all Docker data!"; then
        echo -e "${YELLOW}Cleanup cancelled${NC}"
        return 1
    fi
    
    stop_all_containers
    remove_all_containers
    remove_all_images
    remove_all_volumes
    remove_custom_networks
    clean_build_cache
    
    if [ "$DRY_RUN" != true ]; then
        echo -e "${GREEN}✅ Complete cleanup finished${NC}"
        echo -e "${CYAN}Docker environment is now clean${NC}"
    fi
}

# Function for light cleanup
light_cleanup() {
    echo -e "${GREEN}🧽 Light cleanup: Removing unused resources...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would perform light cleanup${NC}"
        docker system df
    else
        docker container prune -f
        docker image prune -f
        docker network prune -f
        echo -e "${GREEN}✅ Light cleanup completed${NC}"
    fi
}

# Function for medium cleanup
medium_cleanup() {
    echo -e "${YELLOW}🧹 Medium cleanup: Removing most unused resources...${NC}"
    
    if ! confirm_action "Remove all stopped containers, unused images, and volumes?"; then
        return 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would perform medium cleanup${NC}"
        docker system df
    else
        docker container prune -f
        docker image prune -af
        docker volume prune -f
        docker network prune -f
        echo -e "${GREEN}✅ Medium cleanup completed${NC}"
    fi
}

# Parse command line arguments
DRY_RUN=false
FORCE_MODE=false
ACTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            ACTION="all"
            shift
            ;;
        --containers)
            ACTION="containers"
            shift
            ;;
        --images)
            ACTION="images"
            shift
            ;;
        --volumes)
            ACTION="volumes"
            shift
            ;;
        --networks)
            ACTION="networks"
            shift
            ;;
        --system)
            ACTION="system"
            shift
            ;;
        --cache)
            ACTION="cache"
            shift
            ;;
        --project)
            ACTION="project"
            shift
            ;;
        --light)
            ACTION="light"
            shift
            ;;
        --medium)
            ACTION="medium"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Main execution
show_banner
check_docker

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE: No changes will be made${NC}"
    echo ""
fi

show_docker_summary

# Execute based on action
case $ACTION in
    "all")
        complete_cleanup
        ;;
    "containers")
        if confirm_action "Remove all containers?"; then
            stop_all_containers
            remove_all_containers
        fi
        ;;
    "images")
        if confirm_action "Remove all images?"; then
            remove_all_images
        fi
        ;;
    "volumes")
        if confirm_action "Remove all volumes? (DATA WILL BE LOST!)"; then
            remove_all_volumes
        fi
        ;;
    "networks")
        if confirm_action "Remove all custom networks?"; then
            remove_custom_networks
        fi
        ;;
    "system")
        if confirm_action "Run system prune?"; then
            system_prune
        fi
        ;;
    "cache")
        if confirm_action "Clean build cache?"; then
            clean_build_cache
        fi
        ;;
    "project")
        if confirm_action "Remove project-specific resources?"; then
            remove_project_resources
        fi
        ;;
    "light")
        light_cleanup
        ;;
    "medium")
        medium_cleanup
        ;;
    "")
        echo -e "${CYAN}💡 Interactive Mode${NC}"
        echo ""
        echo "Choose cleanup level:"
        echo "1) Light   - Safe cleanup of unused resources"
        echo "2) Medium  - Remove stopped containers and unused images/volumes"
        echo "3) Heavy   - Remove EVERYTHING (⚠️  DANGEROUS!)"
        echo "4) Project - Remove only this project's resources"
        echo "5) Custom  - Choose specific resources to clean"
        echo ""
        read -p "Enter your choice (1-5): " -n 1 -r
        echo ""
        
        case $REPLY in
            1)
                light_cleanup
                ;;
            2)
                medium_cleanup
                ;;
            3)
                complete_cleanup
                ;;
            4)
                if confirm_action "Remove project-specific resources?"; then
                    remove_project_resources
                fi
                ;;
            5)
                echo -e "${CYAN}Custom cleanup - select what to remove:${NC}"
                echo ""
                
                if confirm_action "Remove all containers?" "n"; then
                    stop_all_containers
                    remove_all_containers
                fi
                
                if confirm_action "Remove all images?" "n"; then
                    remove_all_images
                fi
                
                if confirm_action "Remove all volumes? (DATA LOSS!)" "n"; then
                    remove_all_volumes
                fi
                
                if confirm_action "Remove custom networks?" "n"; then
                    remove_custom_networks
                fi
                
                if confirm_action "Clean build cache?" "n"; then
                    clean_build_cache
                fi
                ;;
            *)
                echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
                exit 1
                ;;
        esac
        ;;
esac

echo ""
echo -e "${CYAN}📊 Final Docker Status:${NC}"
show_docker_summary

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 This was a dry run. No changes were made.${NC}"
    echo -e "${CYAN}To actually perform the cleanup, run without --dry-run${NC}"
fi

echo -e "${GREEN}🎉 Cleanup script completed!${NC}" 