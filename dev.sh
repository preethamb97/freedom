#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Encrypted Data UI Development Environment${NC}"

# Check if .env files exist
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found! Please run setup script first.${NC}"
    exit 1
fi

if [ ! -f WEBAPP/.env ]; then
    echo -e "${RED}❌ WEBAPP/.env file not found! Please run setup script first.${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "API/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing API dependencies...${NC}"
    cd API && bun install && cd ..
fi

if [ ! -d "WEBAPP/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing WEBAPP dependencies...${NC}"
    cd WEBAPP && npm install && cd ..
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping development servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}✅ Starting development servers...${NC}"

# Start API in background
echo -e "${BLUE}🔧 Starting API server on http://localhost:3001${NC}"
cd API && bun --watch run src/server.js &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start Frontend in background
echo -e "${BLUE}🌐 Starting Frontend server on http://localhost:3000${NC}"
cd WEBAPP && npm start &
WEBAPP_PID=$!

# Go back to root directory
cd ..

echo -e "${GREEN}✅ Development environment is running!${NC}"
echo -e "${BLUE}📊 API:      http://localhost:3001${NC}"
echo -e "${BLUE}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}💾 Health:   http://localhost:3001/api/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for background processes
wait 