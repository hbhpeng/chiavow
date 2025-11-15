#!/bin/bash

echo "🚀 Starting Chiavow Development Environment..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Server dependencies already installed"
fi

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Client dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "1. Start the backend:"
echo "   cd server && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd client && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
