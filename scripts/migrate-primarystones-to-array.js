/**
 * Migration script to change the primaryStones column from json type to text[] type
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { default as schema } from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

async function migratePrimaryStonesToArray() {
  console.log('Starting migration of primaryStones column from json to text[]...');
  
  try {
    // First, backup the current data
    console.log('Backing up design_requests table...');
    await db.execute`
      CREATE TABLE IF NOT EXISTS design_requests_backup AS
      SELECT * FROM design_requests;
    `;
    console.log('Backup complete.');

    // Create a temporary column to hold the migrated data
    console.log('Creating temporary column primary_stones_array...');
    await db.execute`
      ALTER TABLE design_requests
      ADD COLUMN IF NOT EXISTS primary_stones_array TEXT[];
    `;

    // Get all design requests
    console.log('Fetching all design requests...');
    const designRequests = await db.query`
      SELECT id, primary_stones FROM design_requests;
    `;
    console.log(`Found ${designRequests.rowCount} design requests.`);

    // Migrate each design request
    let migratedCount = 0;
    let errorCount = 0;

    for (const designRequest of designRequests.rows) {
      try {
        let primaryStonesArray = [];
        
        // If we have JSON data, try to parse it
        if (designRequest.primary_stones) {
          try {
            // Handle both string and actual JSON object
            const stonesData = typeof designRequest.primary_stones === 'string' 
              ? JSON.parse(designRequest.primary_stones) 
              : designRequest.primary_stones;
              
            // Ensure it's an array
            if (Array.isArray(stonesData)) {
              primaryStonesArray = stonesData;
            } else {
              console.log(`ID ${designRequest.id}: primary_stones is not an array, value:`, stonesData);
            }
          } catch (parseError) {
            console.error(`Error parsing primary_stones JSON for ID ${designRequest.id}:`, parseError);
            errorCount++;
          }
        }
        
        // Update the temporary column with the array data
        await db.execute`
          UPDATE design_requests
          SET primary_stones_array = ${primaryStonesArray}
          WHERE id = ${designRequest.id}
        `;
        
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating design request ID ${designRequest.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Migration progress: ${migratedCount} migrated, ${errorCount} errors.`);

    // If all goes well, drop the old column and rename the new one
    if (migratedCount > 0 && errorCount === 0) {
      console.log('Dropping primary_stones column and renaming primary_stones_array...');
      await db.execute`
        ALTER TABLE design_requests
        DROP COLUMN primary_stones;
      `;
      
      await db.execute`
        ALTER TABLE design_requests
        RENAME COLUMN primary_stones_array TO primary_stones;
      `;
      
      console.log('Column renamed successfully.');
    } else {
      console.log('Skipping column rename due to errors in migration.');
    }

    console.log('Migration completed.');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
migratePrimaryStonesToArray().catch(error => {
  console.error('Error running migration script:', error);
  process.exit(1);
});