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

// Create client files directory in build folder
const buildClientDir = buildDir;

// Copy all client files (except index.js which we already moved to build/server)
console.log("Copying client files to build directory...");
fs.readdirSync(distDir).forEach(file => {
  if (file !== 'index.js') {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(buildClientDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      // Use cp -r for directories
      console.log(`Copying directory: ${file}`);
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      const files = fs.readdirSync(srcPath);
      files.forEach(subFile => {
        const subSrcPath = path.join(srcPath, subFile);
        const subDestPath = path.join(destPath, subFile);
        console.log(`Copying file: ${subFile}`);
        fs.copyFileSync(subSrcPath, subDestPath);
      });
    } else {
      // Copy files
      console.log(`Copying file: ${file}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
});

console.log("Deployment preparation completed successfully!");
console.log("Files are now ready for Replit deployment.");