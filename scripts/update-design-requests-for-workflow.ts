/**
 * Migration script to update design_requests table for advanced workflow
 * and add design feedback messages table with image support
 */
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function updateDesignRequests() {
  console.log("Starting migration to update design_requests table for advanced workflow...");
  
  try {
    // 1. Add consultation_fee_paid column
    await db.execute(sql`
      ALTER TABLE design_requests
      ADD COLUMN IF NOT EXISTS consultation_fee_paid BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log("Added consultation_fee_paid column");
    
    // 2. Add initial_estimate column
    await db.execute(sql`
      ALTER TABLE design_requests
      ADD COLUMN IF NOT EXISTS initial_estimate INTEGER;
    `);
    console.log("Added initial_estimate column");
    
    // 3. Add final_estimate column
    await db.execute(sql`
      ALTER TABLE design_requests
      ADD COLUMN IF NOT EXISTS final_estimate INTEGER;
    `);
    console.log("Added final_estimate column");
    
    // 4. Add iterations_count column
    await db.execute(sql`
      ALTER TABLE design_requests
      ADD COLUMN IF NOT EXISTS iterations_count INTEGER NOT NULL DEFAULT 0;
    `);
    console.log("Added iterations_count column");
    
    // 5. Update status column with new values
    // First, create a type if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'design_request_status') THEN
          CREATE TYPE design_request_status AS ENUM (
            'pending_acceptance',
            'initial_estimate_requested',
            'initial_estimate_provided',
            'design_started',
            'design_in_progress',
            'design_ready_for_review',
            'design_approved',
            'final_estimate_provided'
          );
        END IF;
      END
      $$;
    `);
    
    // Now update existing statuses to match new format
    await db.execute(sql`
      UPDATE design_requests
      SET status = 'pending_acceptance'
      WHERE status = 'pending';
    `);
    
    await db.execute(sql`
      UPDATE design_requests
      SET status = 'design_approved'
      WHERE status = 'approved';
    `);
    
    await db.execute(sql`
      UPDATE design_requests
      SET status = 'design_started'
      WHERE status = 'quoted';
    `);
    
    console.log("Updated status values to match new workflow states");
    
    // 6. Create design_feedback table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS design_feedback (
        id SERIAL PRIMARY KEY,
        design_request_id INTEGER NOT NULL REFERENCES design_requests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
        image_urls TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created design_feedback table");
    
    // 7. Create index on design_request_id for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_design_feedback_design_request_id
      ON design_feedback(design_request_id);
    `);
    console.log("Created index on design_feedback table");
    
    // 8. Create design_payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS design_payments (
        id SERIAL PRIMARY KEY,
        design_request_id INTEGER NOT NULL REFERENCES design_requests(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        payment_type TEXT NOT NULL, -- 'consultation_fee', 'deposit', 'final_payment'
        payment_method TEXT NOT NULL, -- 'paypal', 'credit_card', etc.
        transaction_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created design_payments table");
    
    // 9. Create index on design_request_id for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_design_payments_design_request_id
      ON design_payments(design_request_id);
    `);
    console.log("Created index on design_payments table");
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration
updateDesignRequests()
  .then(() => {
    console.log("All migrations completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });