#!/bin/bash

echo "🧪 Running Travel Booking App API Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Check if API key is set
if [ -z "$AVIATION_STACK_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  AVIATION_STACK_API_KEY not set in environment${NC}"
    if [ -f .env ]; then
        echo "Loading from .env file..."
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${RED}❌ No .env file found. Please create one with AVIATION_STACK_API_KEY${NC}"
        exit 1
    fi
fi

# Start the server in background
echo "🚀 Starting backend server..."
npm start &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 10

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null
    exit
}
trap cleanup EXIT

# Test 1: Health check
echo "🔍 Testing health endpoint..."
curl -f http://localhost:4000/health >/dev/null 2>&1
print_status $? "Health check"

# Test 2: Airport search
echo "🔍 Testing airport search..."
curl -f "http://localhost:4000/api/airports?keyword=DFW" >/dev/null 2>&1
print_status $? "Airport search (DFW)"

# Test 3: Future flights (rate limiting test)
echo "🔍 Testing future flights with rate limiting..."
for i in {1..3}; do
    echo "   Call $i/3..."
    RESPONSE=$(curl -s "http://localhost:4000/api/flights?originLocationCode=DFW&destinationLocationCode=JFK&departureDate=2025-07-28&adults=1&travelClass=ECONOMY")
    SOURCE=$(echo "$RESPONSE" | jq -r '.apiResponse.source // "unknown"')
    echo "   Source: $SOURCE"
    sleep 2
done

# Test 4: Different routes
echo "🔍 Testing different routes..."
curl -s "http://localhost:4000/api/flights?originLocationCode=LAX&destinationLocationCode=ORD&departureDate=2025-07-28&adults=1&travelClass=ECONOMY" | jq '.apiResponse.source // "unknown"' >/dev/null 2>&1
print_status $? "LAX to ORD route"

curl -s "http://localhost:4000/api/flights?originLocationCode=SFO&destinationLocationCode=BOS&departureDate=2025-07-28&adults=1&travelClass=ECONOMY" | jq '.apiResponse.source // "unknown"' >/dev/null 2>&1
print_status $? "SFO to BOS route"

# Run standalone test files if they exist
echo "🔍 Running standalone test files..."
if [ -f "simpleFutureFlightsTest.js" ]; then
    echo "Running simpleFutureFlightsTest.js..."
    node simpleFutureFlightsTest.js
    print_status $? "Simple future flights test"
fi

if [ -f "comprehensive-api-test.js" ]; then
    echo "Running comprehensive-api-test.js..."
    node comprehensive-api-test.js
    print_status $? "Comprehensive API test"
fi

echo "✅ All tests completed!"
