#!/bin/bash
# Script to prepare files for Replit deployment

echo "=== Starting Luster Legacy Deployment Build Process ==="

# Run the normal build process
echo "Step 1: Running standard build..."
npm run build

# Create build directory structure
echo "Step 2: Creating build directory structure..."
mkdir -p build/server/public
mkdir -p build/server/assets

# Copy server file to the expected location
echo "Step 3: Copying server files to build/server/..."
cp dist/index.js build/server/index.js

# Copy client assets to the server/public directory as Replit expects
echo "Step 4: Copying client assets to build/server/public/..."
cp -r dist/* build/server/public/
rm -f build/server/public/index.js # Remove the server file from client assets

# Also copy client assets to build root for redundancy
echo "Step 5: Also copying client assets to build/ for redundancy..."
cp -r dist/* build/
rm -f build/index.js # Remove the server file from client assets

# Copy uploads and attached_assets for image serving
echo "Step 6: Copying uploads and attached_assets directories..."
if [ -d "uploads" ]; then
  mkdir -p build/server/uploads
  cp -r uploads/* build/server/uploads/ 2>/dev/null || true
  echo "Copied uploads directory to build/server/uploads/"
fi

if [ -d "attached_assets" ]; then
  mkdir -p build/server/attached_assets
  cp -r attached_assets/* build/server/attached_assets/ 2>/dev/null || true
  echo "Copied attached_assets directory to build/server/attached_assets/"
fi

# Create a .env file in the server directory
echo "Step 7: Creating environment configuration..."
echo "NODE_ENV=production" > build/server/.env
echo "PORT=8080" >> build/server/.env

echo "=== Build process completed successfully ==="
echo "Server file: build/server/index.js"
echo "Client assets: build/server/public/*"
echo "Image assets: build/server/uploads/* and build/server/attached_assets/*"

exit 0