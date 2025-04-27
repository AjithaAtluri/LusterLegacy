// Build script for Replit deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Starting build process for deployment...${colors.reset}`);

// Step 1: Build the client with Vite
console.log(`${colors.yellow}Building client with Vite...${colors.reset}`);
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log(`${colors.green}Client build successful!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Client build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 2: Ensure build/server directory exists
const serverBuildDir = path.join(process.cwd(), 'build', 'server');
console.log(`${colors.yellow}Creating server build directory: ${serverBuildDir}${colors.reset}`);
if (!fs.existsSync(serverBuildDir)) {
  fs.mkdirSync(serverBuildDir, { recursive: true });
}

// Step 3: Build the server with esbuild
console.log(`${colors.yellow}Building server with esbuild...${colors.reset}`);
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=build/server', { stdio: 'inherit' });
  console.log(`${colors.green}Server build successful!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Server build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 4: Copy public assets directory to build directory
console.log(`${colors.yellow}Copying public assets to build directory...${colors.reset}`);
const publicDir = path.join(process.cwd(), 'public');
const buildPublicDir = path.join(process.cwd(), 'build', 'public');

if (fs.existsSync(publicDir)) {
  if (!fs.existsSync(buildPublicDir)) {
    fs.mkdirSync(buildPublicDir, { recursive: true });
  }
  
  fs.readdirSync(publicDir).forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(buildPublicDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      // Copy recursively for directories
      execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  });
  console.log(`${colors.green}Public assets copied successfully!${colors.reset}`);
} else {
  console.log(`${colors.yellow}No public directory found, skipping asset copy.${colors.reset}`);
}

// Step 5: Create a production .env file if needed
console.log(`${colors.yellow}Setting up environment configuration...${colors.reset}`);
const envContent = `NODE_ENV=production\n`;
fs.writeFileSync(path.join(process.cwd(), 'build', '.env'), envContent);

console.log(`${colors.green}Build completed successfully! Deployment package is ready in the build directory.${colors.reset}`);
console.log(`${colors.blue}To start the application, use: NODE_ENV=production node build/server/index.js${colors.reset}`);