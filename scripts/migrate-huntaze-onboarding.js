#!/usr/bin/env node

/**
 * Shopify-Style Onboarding Migration Script
 * 
 * This script applies the database migration for the Shopify-style onboarding system.
 * It creates all necessary tables, indexes, and seed data.
 * 
 * Usage:
 *   node scripts/migrate-shopify-onboarding.js [--rollback]
 * 
 * Options:
 *   --rollback    Rollback the migration (remove all tables)
 *   --dry-run     Show SQL without executing
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Parse command line arguments
const args = process.argv.slice(2);
const isRollback = args.includes('--rollback');
const isDryRun = args.includes('--dry-run');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Shopify-style onboarding migration...\n');
    
    // Read migration file
    const migrationFile = isRollback
      ? 'lib/db/migrations/2024-11-11-shopify-style-onboarding-rollback.sql'
      : 'lib/db/migrations/2024-11-11-shopify-style-onboarding.sql';
    
    const migrationPath = path.join(process.cwd(), migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    if (isDryRun) {
      console.log('📄 DRY RUN - SQL to be executed:\n');
      console.log(sql);
      console.log('\n✅ Dry run complete. No changes made.');
      return;
    }
    
    // Execute migration
    console.log(`📝 Executing ${isRollback ? 'rollback' : 'migration'}...`);
    await client.query(sql);
    
    if (isRollback) {
      console.log('\n✅ Rollback completed successfully!');
      console.log('   - All Shopify-style onboarding tables removed');
      console.log('   - Indexes and triggers dropped');
      console.log('   - Helper functions removed');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('   - onboarding_step_definitions table created');
      console.log('   - user_onboarding table created');
      console.log('   - onboarding_events table created');
      console.log('   - user_consent table created');
      console.log('   - Indexes and triggers created');
      console.log('   - Helper functions created');
      console.log('   - Seed data inserted');
      
      // Verify tables were created
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('onboarding_step_definitions', 'user_onboarding', 'onboarding_events', 'user_consent')
        ORDER BY table_name
      `);
      
      console.log('\n📊 Created tables:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      
      // Show seed data count
      const stepCount = await client.query('SELECT COUNT(*) FROM onboarding_step_definitions');
      console.log(`\n🌱 Seed data: ${stepCount.rows[0].count} onboarding steps created`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
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
