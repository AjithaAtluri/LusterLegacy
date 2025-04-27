// Simplified deployment helper
import fs from 'fs';
import path from 'path';

console.log('Creating necessary deployment directory structure...');

// Ensure build/server directory exists
const serverDir = path.join(process.cwd(), 'build', 'server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
  console.log('Created build/server directory');
}

// Create a simple redirector file that will run the original server code
const redirectorContent = `
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
`;

// Write the redirector file
const redirectorPath = path.join(serverDir, 'index.js');
fs.writeFileSync(redirectorPath, redirectorContent);
console.log('Created server redirector at build/server/index.js');

// Create a .env file for production configuration
const envPath = path.join(serverDir, '.env');
fs.writeFileSync(envPath, 'NODE_ENV=production\n');
console.log('Created production environment configuration');

console.log('Deployment setup complete!');
console.log('You should now be able to deploy the application.');