// Build script for Replit deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

// Step 2: Ensure build directories exist
const serverBuildDir = path.join(process.cwd(), 'build', 'server');
const serverPublicDir = path.join(serverBuildDir, 'public');
console.log(`${colors.yellow}Creating build directories...${colors.reset}`);
fs.mkdirSync(serverPublicDir, { recursive: true });

// Step 3: Build the server with esbuild
console.log(`${colors.yellow}Building server with esbuild...${colors.reset}`);
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=build/server', { stdio: 'inherit' });
  console.log(`${colors.green}Server build successful!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Server build failed: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 4: Copy client build files to server public directory
console.log(`${colors.yellow}Copying client build files to server public directory...${colors.reset}`);
const distPublicDir = path.join(process.cwd(), 'dist', 'public');
try {
  execSync(`cp -r "${distPublicDir}/"* "${serverPublicDir}"`, { stdio: 'inherit' });
  console.log(`${colors.green}Client build files copied successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to copy client build files: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 5: Create a production .env file if needed
console.log(`${colors.yellow}Setting up environment configuration...${colors.reset}`);
const envContent = `NODE_ENV=production\n`;
fs.writeFileSync(path.join(process.cwd(), 'build', '.env'), envContent);

console.log(`${colors.green}Build completed successfully! Deployment package is ready in the build directory.${colors.reset}`);