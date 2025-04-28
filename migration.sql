-- Step 1: Create a backup of the design_requests table
CREATE TABLE IF NOT EXISTS design_requests_backup AS SELECT * FROM design_requests;

-- Step 2: Add a new column of type text[] to store the migrated data
ALTER TABLE design_requests ADD COLUMN IF NOT EXISTS primary_stones_array TEXT[] DEFAULT '{}';

-- Step 3: Update the new column with values from the existing JSONB column where possible
UPDATE design_requests 
SET primary_stones_array = ARRAY[primary_stone] 
WHERE primary_stone IS NOT NULL AND primary_stone != '';

-- Step 4: Drop the old json column (after we've confirmed the migration is successful)
ALTER TABLE design_requests DROP COLUMN primary_stones;

-- Step 5: Rename the new column to match the schema definition
ALTER TABLE design_requests RENAME COLUMN primary_stones_array TO primary_stones;