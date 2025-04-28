import { pool } from '../server/db.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

// Function to hash password in the correct format
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  try {
    // Generate proper password hashes
    const adminPassword = await hashPassword('admin123');
    const customerPassword = await hashPassword('password');
    
    console.log('Admin password hash:', adminPassword);
    console.log('Customer password hash:', customerPassword);
    
    // Update users directly with SQL queries
    const updateAdminQuery = `UPDATE users SET password = $1 WHERE id = 1`;
    await pool.query(updateAdminQuery, [adminPassword]);
    
    const updateCustomerQuery = `UPDATE users SET password = $1 WHERE id = 2`;
    await pool.query(updateCustomerQuery, [customerPassword]);
    
    console.log('Password updates completed successfully');
    
    // Verify the updates
    const verifyQuery = `SELECT id, username, password FROM users`;
    const result = await pool.query(verifyQuery);
    console.log('Updated users:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Password: ${user.password.substring(0, 20)}...`);
    });
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
