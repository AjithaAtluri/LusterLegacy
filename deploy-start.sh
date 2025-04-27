#!/bin/bash
# Startup script for Replit deployment

echo "=== Starting Luster Legacy Application ==="
echo "Environment: $NODE_ENV"
echo "Starting server from: build/server/index.js"

# Start the server
NODE_ENV=production node build/server/index.js