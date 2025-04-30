/**
 * Migration script to update the design_request_comments table with the missing created_by column
 */
import { pool } from '../server/db.ts';

async function updateCommentsTable() {
  console.log('Updating design_request_comments table...');
  
  try {
    // Add created_by column if it doesn't exist
    const addCreatedByColumnQuery = `
      ALTER TABLE design_request_comments 
      ADD COLUMN IF NOT EXISTS created_by TEXT NULL;
    `;
    
    await pool.query(addCreatedByColumnQuery);
    console.log('Added created_by column to design_request_comments table.');
    
  } catch (error) {
    console.error('Error updating design_request_comments table:', error);
    throw error;
  }
}

// Run the migration
async function main() {
  try {
    await updateCommentsTable();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();