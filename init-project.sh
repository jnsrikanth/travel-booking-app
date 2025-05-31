#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories if they don't exist
mkdir -p backend/src/{routes,services,utils,middleware}
mkdir -p docker/mysql

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please update .env file with your Amadeus API credentials"
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Build and start containers
echo "Building and starting Docker containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "Services are running successfully!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:4000"
else
    echo "Error: Some services failed to start. Please check docker-compose logs."
    exit 1
fi

echo "Setup complete! Please ensure you've updated the .env file with your Amadeus API credentials."
