/**
 * Migration script to add the primaryStones column to existing design_requests table
 * and populate it based on existing primaryStone values
 */
const { db } = require('../server/db');
const { sql } = require('drizzle-orm');

async function migrateDesignRequests() {
  console.log('Starting design_requests table migration for primaryStones field...');

  try {
    // First check if the primaryStones column already exists
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'design_requests' 
      AND column_name = 'primary_stones';
    `;
    
    const columnExists = await db.execute(sql.raw(checkColumnSQL));
    
    if (columnExists.length === 0) {
      // Add the primaryStones column if it doesn't exist
      console.log('Adding primary_stones column to design_requests table...');
      const addColumnSQL = `
        ALTER TABLE design_requests
        ADD COLUMN primary_stones JSONB;
      `;
      
      await db.execute(sql.raw(addColumnSQL));
      console.log('Successfully added primary_stones column.');
    } else {
      console.log('primary_stones column already exists, skipping column creation.');
    }
    
    // Now populate the primaryStones column for existing records
    console.log('Populating primary_stones from existing primary_stone values...');
    
    // Get all design requests that have a primaryStone but no primaryStones
    const designRequests = await db.execute(sql.raw(`
      SELECT id, primary_stone 
      FROM design_requests 
      WHERE primary_stone IS NOT NULL 
      AND (primary_stones IS NULL OR primary_stones = 'null' OR primary_stones = '[]');
    `));
    
    console.log(`Found ${designRequests.length} design requests to update.`);
    
    if (designRequests.length > 0) {
      for (const request of designRequests) {
        const primaryStone = request.primary_stone;
        if (!primaryStone || primaryStone.trim() === '') continue;
        
        // Convert to array format and set as JSON
        const primaryStones = JSON.stringify([primaryStone]);
        
        // Update the record
        await db.execute(sql.raw(`
          UPDATE design_requests 
          SET primary_stones = $1 
          WHERE id = $2
        `), [primaryStones, request.id]);
        
        console.log(`Updated design request ID ${request.id}: primary_stone="${primaryStone}" → primary_stones=${primaryStones}`);
      }
      
      console.log(`Successfully updated ${designRequests.length} design requests.`);
    }
    
    console.log('Design requests migration completed successfully!');
  } catch (error) {
    console.error('Error during design_requests migration:', error);
    throw error;
  }
}

// Run the migration
migrateDesignRequests()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });