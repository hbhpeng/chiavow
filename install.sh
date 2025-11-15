#!/bin/bash

echo "🔧 Installing Chiavow Dependencies..."
echo ""

# Check if we're in the right directory
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the chiavow root directory"
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --legacy-peer-deps --prefer-offline

if [ $? -eq 0 ]; then
    echo "✅ Server dependencies installed successfully"
else
    echo "⚠️  Server dependencies installation had issues, but might still work"
fi

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd ../client
npm install --legacy-peer-deps --prefer-offline

if [ $? -eq 0 ]; then
    echo "✅ Client dependencies installed successfully"
else
    echo "⚠️  Client dependencies installation had issues, but might still work"
fi

cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start the application:"
echo "1. Terminal 1: cd server && npm run dev"
echo "2. Terminal 2: cd client && npm run dev"
echo "3. Open http://localhost:3000"
