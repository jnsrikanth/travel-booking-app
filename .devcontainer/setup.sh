#!/bin/bash

echo "🚀 Setting up Travel Booking App development environment..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

# Make scripts executable
chmod +x start-app.sh
chmod +x backend/dev-test.sh

echo "✅ Development environment setup complete!"
echo "🔧 Available commands:"
echo "  - npm run dev (from backend/) - Start backend in dev mode"
echo "  - npm run dev (from frontend/) - Start frontend in dev mode"
echo "  - ./start-app.sh - Start both frontend and backend"
echo "  - ./backend/dev-test.sh - Run API tests"
echo ""
echo "📝 Don't forget to set your environment variables in backend/.env"
echo "   AVIATION_STACK_API_KEY=your_api_key_here"
