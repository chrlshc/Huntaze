#!/usr/bin/env node

/**
 * CRM Tables Migration Script
 * Creates all CRM-related tables in PostgreSQL
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // AWS RDS requires SSL
});

async function runMigration() {
  console.log('🚀 Starting CRM tables migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../lib/db/migrations/2024-10-31-crm-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL statements...\n');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'user_profiles', 'ai_configs', 'fans', 'conversations', 
        'messages', 'campaigns', 'platform_connections', 
        'quick_replies', 'analytics_events'
      )
      ORDER BY table_name
    `);

    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 CRM tables migration complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${result.rows.length} tables created`);
    console.log('   • Indexes created for performance');
    console.log('   • Triggers set up for updated_at');
    console.log('   • Foreign keys configured');

    console.log('\n🔄 Next steps:');
    console.log('   1. Update API routes to use PostgreSQL instead of in-memory');
    console.log('   2. Create repository classes for each table');
    console.log('   3. Migrate existing in-memory data (if any)');
    console.log('   4. Test the new database-backed APIs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
