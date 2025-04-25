import fs from 'fs';
import path from 'path';

/**
 * This function ensures that the uploads directory exists and is properly set up
 * to persist between deployments.
 */
export function ensureUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Create the uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Log info about uploads directory
  console.log(`Uploads directory found at: ${uploadsDir}`);
  
  // List existing files in uploads directory
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory`);
    
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }
}