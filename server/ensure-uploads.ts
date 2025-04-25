import fs from 'fs';
import path from 'path';

/**
 * This function ensures that the uploads directory exists and is properly set up
 * to persist between deployments.
 * 
 * It uses the attached_assets folder as the primary storage location, which is part of
 * the source control and will persist between deployments.
 */
export function ensureUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
  
  // Create the uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Ensure attached_assets directory exists
  if (!fs.existsSync(attachedAssetsDir)) {
    console.log('Creating attached_assets directory');
    fs.mkdirSync(attachedAssetsDir, { recursive: true });
  }

  // Log info about uploads directory
  console.log(`Uploads directory found at: ${uploadsDir}`);
  console.log(`Attached assets directory found at: ${attachedAssetsDir}`);
  
  // Copy any existing files from uploads to attached_assets for persistence
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory`);
    
    // Copy files to attached_assets to ensure persistence
    let filesCopied = 0;
    for (const file of files) {
      const sourcePath = path.join(uploadsDir, file);
      const destPath = path.join(attachedAssetsDir, file);
      
      // Only copy if file doesn't already exist in attached_assets
      if (!fs.existsSync(destPath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          filesCopied++;
        } catch (copyError) {
          console.error(`Failed to copy file ${file}:`, copyError);
        }
      }
    }
    
    if (filesCopied > 0) {
      console.log(`Copied ${filesCopied} files from uploads to attached_assets for persistence`);
    }
    
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }
}