#!/bin/bash
# Startup script for Replit deployment

echo "=== Starting Luster Legacy Application ==="
echo "Environment: $NODE_ENV"
echo "Current directory: $(pwd)"
echo "Checking build directory structure..."

# Check build structure
if [ -f "build/server/index.js" ]; then
  echo "✓ Server file exists at build/server/index.js"
else
  echo "✗ ERROR: Server file not found at build/server/index.js"
  ls -la build/ || echo "build/ directory not found"
  ls -la build/server/ 2>/dev/null || echo "build/server/ directory not found"
fi

if [ -d "build/server/public" ]; then
  echo "✓ Public directory exists at build/server/public/"
  ls -la build/server/public/ | head -n 10
else
  echo "✗ ERROR: Public directory not found at build/server/public/"
fi

# Make the script executable
chmod +x build/server/index.js 2>/dev/null || true

# Create a temporary symbolic link for assets if they don't exist
if [ ! -d "build/server/public/assets" ] && [ -d "build/assets" ]; then
  echo "Creating symbolic link for assets directory..."
  ln -sf $(pwd)/build/assets $(pwd)/build/server/public/assets
fi

echo "Starting server from: build/server/index.js"

# Start the server
NODE_ENV=production node build/server/index.js