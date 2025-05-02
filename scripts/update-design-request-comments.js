/**
 * Migration script to add imageUrl and userId columns to the design_request_comments table
 */
import { pool } from '../server/db.ts';

async function updateDesignRequestCommentsTable() {
  console.log('Updating design_request_comments table...');
  
  try {
    // Check if the columns already exist
    const checkColumnsQuery = `
      SELECT 
        COUNT(*) as image_url_exists 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'design_request_comments' 
        AND column_name = 'image_url';
    `;
    
    const { rows: [{ image_url_exists }] } = await pool.query(checkColumnsQuery);
    
    // Add image_url column if it doesn't exist
    if (image_url_exists === '0') {
      const addImageUrlColumnQuery = `
        ALTER TABLE design_request_comments 
        ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
      `;
      
      await pool.query(addImageUrlColumnQuery);
      console.log('Added image_url column to design_request_comments table.');
    } else {
      console.log('image_url column already exists in design_request_comments table.');
    }
    
    // Check for user_id column
    const checkUserIdQuery = `
      SELECT 
        COUNT(*) as user_id_exists 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'design_request_comments' 
        AND column_name = 'user_id';
    `;
    
    const { rows: [{ user_id_exists }] } = await pool.query(checkUserIdQuery);
    
    // Add user_id column if it doesn't exist
    if (user_id_exists === '0') {
      const addUserIdColumnQuery = `
        ALTER TABLE design_request_comments 
        ADD COLUMN IF NOT EXISTS user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
      `;
      
      await pool.query(addUserIdColumnQuery);
      console.log('Added user_id column to design_request_comments table.');
    } else {
      console.log('user_id column already exists in design_request_comments table.');
    }
    
  } catch (error) {
    console.error('Error updating design_request_comments table:', error);
    throw error;
  }
}

// Run the migration
async function main() {
  try {
    await updateDesignRequestCommentsTable();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();