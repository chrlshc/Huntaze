#!/usr/bin/env node

/**
 * Content Creation System Database Migration Script
 * 
 * This script runs the content creation database migration to set up:
 * - content_items table for drafts and published content
 * - media_assets table for images and videos
 * - content_media junction table
 * - content_platforms for multi-platform publishing
 * - content_tags for organization
 * - templates for reusable content structures
 * - content_variations for A/B testing
 * - user_storage_quota for tracking storage usage
 * 
 * Usage: node scripts/migrate-content-creation.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Content Creation migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', '2024-10-31-content-creation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('📝 Creating tables...');
    await client.query(migrationSQL);
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'content_items',
        'media_assets',
        'content_media',
        'content_platforms',
        'content_tags',
        'templates',
        'content_variations',
        'user_storage_quota'
      )
      ORDER BY table_name
    `);
    
    console.log('\n✅ Tables created:');
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Verify indexes
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'content_items',
        'media_assets',
        'content_media',
        'content_platforms',
        'content_tags',
        'templates',
        'content_variations'
      )
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    
    console.log('\n✅ Indexes created:');
    indexCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });
    
    // Verify triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND trigger_name LIKE 'trigger_%'
      AND event_object_table IN ('content_items', 'media_assets')
      ORDER BY trigger_name
    `);
    
    console.log('\n✅ Triggers created:');
    triggerCheck.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Content Creation migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${tableCheck.rows.length} tables created`);
    console.log(`   - ${indexCheck.rows.length} indexes created`);
    console.log(`   - ${triggerCheck.rows.length} triggers created`);
    console.log('\n✨ The Content Creation System database is ready to use!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
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
