/**
 * Migration script to add the currency column to the order_items table
 */
import pg from 'pg';

const { Pool } = pg;

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addCurrencyColumn() {
  try {
    console.log('Adding currency column to order_items table...');
    
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'currency'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Currency column does not exist, adding it...');
      
      // Add the currency column with a default value of 'USD'
      await pool.query(`
        ALTER TABLE order_items 
        ADD COLUMN currency TEXT DEFAULT 'USD'
      `);
      
      console.log('Successfully added currency column to order_items table');
    } else {
      console.log('Currency column already exists in order_items table');
    }
  } catch (error) {
    console.error('Error adding currency column:', error);
    throw error;
  }
}

async function main() {
  try {
    await addCurrencyColumn();
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();