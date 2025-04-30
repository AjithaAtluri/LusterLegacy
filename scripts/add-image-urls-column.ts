/**
 * Migration script to add the image_urls column to the design_requests table
 */
import { db, pool } from '../server/db';

async function addImageUrlsColumn() {
  try {
    console.log('Starting migration to add image_urls column to design_requests table...');
    
    // Check if column already exists
    const checkColumnSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'design_requests' AND column_name = 'image_urls'
      ) as column_exists;
    `;
    
    const checkResult = await pool.query(checkColumnSql);
    
    if (checkResult.rows[0].column_exists) {
      console.log('Column image_urls already exists in design_requests table. No action needed.');
      return;
    }
    
    // Add the image_urls column as text[]
    const addColumnSql = `
      ALTER TABLE design_requests 
      ADD COLUMN image_urls text[] NOT NULL DEFAULT '{}';
    `;
    
    await pool.query(addColumnSql);
    
    console.log('Successfully added image_urls column to design_requests table.');
    
    // For existing design requests, set the image_urls to contain the imageUrl
    const updateExistingRecordsSql = `
      UPDATE design_requests 
      SET image_urls = ARRAY[image_url] 
      WHERE image_url IS NOT NULL AND array_length(image_urls, 1) IS NULL;
    `;
    
    await pool.query(updateExistingRecordsSql);
    
    console.log('Successfully updated existing records with image_url data.');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // End the connection
    await pool.end();
  }
}

// Execute the migration
addImageUrlsColumn();