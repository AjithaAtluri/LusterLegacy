
// This is a simple redirector file to run the original server code
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
const fs = require('fs');

// Set up environment for production
process.env.NODE_ENV = 'production';

console.log('=== Starting Luster Legacy in Production Mode ===');
console.log('Running from build/server/index.js');
console.log('Loading original server code from dist/index.js');

// Import and run the actual server code
import('../../dist/index.js')
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
