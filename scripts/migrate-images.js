import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script helps migrate product images from the database to the persistent uploads directory.
 * 
 * It works by:
 * 1. Retrieving existing product image paths from the database
 * 2. Copying missing images from various potential locations to the uploads directory
 * 3. Optionally copying lost/missing images from other images to serve as placeholders
 */

// Configuration
const uploadsDir = path.join(process.cwd(), 'uploads');
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at ${uploadsDir}`);
}

// Run the script to recover images
async function migrateImages() {
  try {
    // Get list of images from the database
    console.log('Finding product images in database...');
    const dbImageList = await getProductImagesFromDB();
    console.log(`Found ${dbImageList.length} product images in database.`);

    // Get list of physical image files in the uploads directory
    const existingImages = fs.readdirSync(uploadsDir);
    console.log(`Found ${existingImages.length} files in uploads directory.`);

    // Find missing images
    const missingImages = dbImageList.filter(img => {
      const filename = img.split('/').pop();
      return !existingImages.includes(filename);
    });

    console.log(`Found ${missingImages.length} missing images.`);

    // Try to recover missing images
    const recoveredCount = await recoverMissingImages(missingImages);
    console.log(`Recovered ${recoveredCount} missing images.`);

    if (missingImages.length - recoveredCount > 0) {
      console.log(`Warning: ${missingImages.length - recoveredCount} images could not be recovered.`);
      console.log('Consider updating the database records or providing new images.');
    }

    console.log('Image migration complete!');
  } catch (error) {
    console.error('Error migrating images:', error);
  }
}

// Function to get product image URLs from the database
async function getProductImagesFromDB() {
  try {
    // Use psql to execute a SQL query and get the results
    const result = execSync(`psql "$DATABASE_URL" -t -c "SELECT image_url FROM products WHERE image_url IS NOT NULL;"`).toString();
    return result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error('Error getting product images from database:', error);
    return [];
  }
}

// Function to recover missing images from various locations
async function recoverMissingImages(missingImages) {
  let recoveredCount = 0;

  // Places to search for images
  const searchPaths = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'client', 'src', 'assets')
  ];

  // Try to find and copy each missing image
  for (const imgPath of missingImages) {
    const filename = imgPath.split('/').pop();
    let found = false;

    // Check all potential locations
    for (const searchPath of searchPaths) {
      const potentialPath = path.join(searchPath, filename);
      if (fs.existsSync(potentialPath)) {
        // Copy the file to the uploads directory
        fs.copyFileSync(potentialPath, path.join(uploadsDir, filename));
        console.log(`Recovered: ${filename} from ${searchPath}`);
        recoveredCount++;
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`Could not find: ${filename}`);
    }
  }

  return recoveredCount;
}

// Run the migration
migrateImages().catch(console.error);