#!/bin/bash

echo "🚀 Starting Chiavow Application..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "Please run this script from the client or server directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "✅ Starting application..."
npm run dev
