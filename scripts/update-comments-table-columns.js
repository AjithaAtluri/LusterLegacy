/**
 * Migration script to add the is_admin column to the design_request_comments table
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function updateCommentsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // First check if is_admin column already exists to avoid errors
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'design_request_comments' 
      AND column_name = 'is_admin'
    `;
    
    const columnCheck = await pool.query(checkColumnQuery);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding is_admin column to design_request_comments table...');
      
      // Add the is_admin column with a default value of false
      await pool.query(`
        ALTER TABLE design_request_comments
        ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false
      `);
      
      console.log('Successfully added is_admin column');
    } else {
      console.log('is_admin column already exists, skipping...');
    }

    // Commit the transaction
    await pool.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Error updating comments table:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

async function main() {
  try {
    await updateCommentsTable();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute the script
main();