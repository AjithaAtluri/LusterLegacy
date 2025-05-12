import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Starting email verification migration...");
    
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verified';
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding email_verified and verification_token columns to users table");
      
      // Add the new columns
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN verification_token TEXT;
      `);
      
      console.log("Migration completed successfully");
    } else {
      console.log("Columns already exist, skipping migration");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
export {};