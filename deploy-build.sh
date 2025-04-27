#!/bin/bash
# Script to prepare files for Replit deployment

echo "=== Starting Luster Legacy Deployment Build Process ==="

# Run the normal build process
echo "Step 1: Running standard build..."
npm run build

# Create build directory structure
echo "Step 2: Creating build directory structure..."
mkdir -p build/server
mkdir -p build/assets

# Copy server file to the expected location
echo "Step 3: Copying server files to build/server/..."
cp dist/index.js build/server/index.js

# Copy client assets to build directory
echo "Step 4: Copying client assets to build directory..."
cp -r dist/* build/
rm -f build/index.js # Remove the server file from client assets

echo "=== Build process completed successfully ==="
echo "Server file: build/server/index.js"
echo "Client assets: build/*"

exit 0