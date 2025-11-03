#!/usr/bin/env node

/**
 * Advanced Analytics Tables Migration Script
 * Creates all analytics-related tables in PostgreSQL
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
  console.log('🚀 Starting Advanced Analytics tables migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../lib/db/migrations/2024-10-31-advanced-analytics.sql');
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
        'analytics_snapshots', 'performance_goals', 'report_schedules',
        'generated_reports', 'industry_benchmarks', 'alert_configurations',
        'alert_history'
      )
      ORDER BY table_name
    `);

    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Advanced Analytics tables migration complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${result.rows.length} tables created`);
    console.log('   • Indexes created for performance optimization');
    console.log('   • Triggers set up for updated_at columns');
    console.log('   • Foreign keys configured with CASCADE delete');

    console.log('\n🔄 Next steps:');
    console.log('   1. Create AnalyticsRepository for data access');
    console.log('   2. Implement MetricsAggregationService');
    console.log('   3. Create analytics snapshot worker');
    console.log('   4. Build analytics dashboard UI');
    console.log('   5. Test with sample data');

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
