#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Content Collaboration migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../lib/db/migrations/2024-11-03-content-collaboration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    
    console.log('📝 Creating collaboration tables...');
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Content Collaboration migration completed successfully!');
    console.log('');
    console.log('📊 Created tables:');
    console.log('  - content_collaborators (for sharing and permissions)');
    console.log('  - content_comments (for commenting system)');
    console.log('  - content_revisions (for revision history)');
    console.log('  - content_presence (for real-time presence)');
    console.log('');
    console.log('🔧 Added columns to content_items:');
    console.log('  - title (for content titles)');
    console.log('  - type (for content types)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verify database connection first
async function verifyConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL environment variable');
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying database connection...');
  
  if (!(await verifyConnection())) {
    process.exit(1);
  }
  
  await runMigration();
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runMigration };