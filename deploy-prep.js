
// Script to prepare files for Replit deployment
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("Starting deployment preparation...");

// Run the regular build first
console.log("Running npm build...");
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create build/server directory if it doesn't exist
const buildServerDir = path.join(process.cwd(), 'build', 'server');
if (!fs.existsSync(buildServerDir)) {
  console.log(`Creating directory: ${buildServerDir}`);
  fs.mkdirSync(buildServerDir, { recursive: true });
}

// Copy the server file from dist to build/server
const sourceFile = path.join(process.cwd(), 'dist', 'index.js');
const targetFile = path.join(buildServerDir, 'index.js');

if (fs.existsSync(sourceFile)) {
  console.log(`Copying server file from ${sourceFile} to ${targetFile}`);
  fs.copyFileSync(sourceFile, targetFile);
  console.log("Server file copied successfully!");
} else {
  console.error(`ERROR: Source file does not exist: ${sourceFile}`);
  process.exit(1);
}

// Copy built client files to build directory
const distDir = path.join(process.cwd(), 'dist');
const buildDir = path.join(process.cwd(), 'build');

// Copy all client files (except index.js which we already moved to build/server)
console.log("Copying client files to build directory...");
fs.readdirSync(distDir).forEach(file => {
  if (file !== 'index.js') {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(buildDir, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      console.log(`Copying directory: ${file}`);
      copyRecursive(srcPath, destPath);
    } else {
      console.log(`Copying file: ${file}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
});

console.log("Deployment preparation completed successfully!");
console.log("Files are now ready for Replit deployment.");
