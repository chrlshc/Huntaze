#!/usr/bin/env node

/**
 * Adaptive Onboarding Database Migration Script
 * 
 * This script creates the database schema for the adaptive onboarding system:
 * - onboarding_profiles: User onboarding state and progress
 * - feature_unlock_states: Feature unlock tracking
 * - onboarding_events: Analytics and event tracking
 * 
 * Usage:
 *   node scripts/migrate-adaptive-onboarding.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Adaptive Onboarding migration...\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', '2024-11-02-adaptive-onboarding.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    console.log('✓ Transaction started');
    
    // Execute migration
    await client.query(migrationSQL);
    console.log('✓ Migration SQL executed');
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('onboarding_profiles', 'feature_unlock_states', 'onboarding_events')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables created:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verify indexes
    const indexCheck = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('onboarding_profiles', 'feature_unlock_states', 'onboarding_events')
      ORDER BY tablename, indexname
    `);
    
    console.log('\n📇 Indexes created:');
    let currentTable = '';
    indexCheck.rows.forEach(row => {
      if (row.tablename !== currentTable) {
        currentTable = row.tablename;
        console.log(`\n  ${row.tablename}:`);
      }
      console.log(`    ✓ ${row.indexname}`);
    });
    
    // Verify functions
    const functionCheck = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('calculate_onboarding_progress', 'is_feature_unlocked', 'update_onboarding_updated_at')
      ORDER BY routine_name
    `);
    
    console.log('\n⚙️  Functions created:');
    functionCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.routine_name}()`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!\n');
    
    // Display summary
    console.log('📋 Summary:');
    console.log(`  Tables: ${tableCheck.rows.length}`);
    console.log(`  Indexes: ${indexCheck.rows.length}`);
    console.log(`  Functions: ${functionCheck.rows.length}`);
    console.log('');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
