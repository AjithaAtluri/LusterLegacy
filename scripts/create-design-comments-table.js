/**
 * Migration script to create the design_request_comments table
 */
import { pool } from '../server/db.ts';

async function createDesignCommentsTable() {
  console.log('Creating design_request_comments table...');
  
  try {
    // First check if the table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'design_request_comments'
      );
    `;
    
    const { rows: [{ exists }] } = await pool.query(checkTableQuery);
    
    if (exists) {
      console.log('design_request_comments table already exists.');
      return;
    }
    
    // Create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE design_request_comments (
        id SERIAL PRIMARY KEY,
        design_request_id INTEGER NOT NULL REFERENCES design_requests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
        image_urls TEXT[] DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('design_request_comments table created successfully.');
    
    // Create index to speed up queries
    const createIndexQuery = `
      CREATE INDEX idx_design_request_comments_design_request_id 
      ON design_request_comments(design_request_id);
    `;
    
    await pool.query(createIndexQuery);
    console.log('Index on design_request_comments created successfully.');
    
  } catch (error) {
    console.error('Error creating design_request_comments table:', error);
    throw error;
  }
}

// Run the migration
async function main() {
  try {
    await createDesignCommentsTable();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();