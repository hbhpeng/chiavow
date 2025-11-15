#!/bin/bash

echo "🏗️  Building Chiavow for Production..."

# Build server
echo ""
echo "📦 Building server..."
cd server
npm install --production
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Server build completed"
else
    echo "❌ Server build failed"
    exit 1
fi

# Build client
echo ""
echo "📦 Building client..."
cd ../client
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Client build completed"
else
    echo "❌ Client build failed"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "Server files are in: server/dist"
echo "Client files are in: client/dist"
echo ""
echo "Next steps for deployment:"
echo "1. Upload these files to your server"
echo "2. Install Node.js on the server"
echo "3. Run: cd server && npm start"
echo "4. Configure Nginx to serve client/dist"
echo ""
echo "See README.md for detailed deployment instructions"
