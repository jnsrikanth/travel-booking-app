#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Travel Booking App...${NC}"

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking port $port...${NC}"
    
    # Find process using the port
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo -e "${RED}Port $port is in use by process $pid${NC}"
        echo -e "${YELLOW}Killing process $pid...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ Port $port freed${NC}"
    else
        echo -e "${GREEN}✓ Port $port is already free${NC}"
    fi
}

# Kill processes on ports 3000 and 4000
kill_port 3000
kill_port 4000

# Start backend
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 3

# Check if backend is running
if curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running on port 4000${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
fi

# Start frontend
echo -e "\n${YELLOW}Starting frontend...${NC}"
npm run dev

# This will only run if frontend exits
echo -e "\n${RED}Frontend stopped. Killing backend...${NC}"
kill $BACKEND_PID 2>/dev/null 