#!/usr/bin/env node

/**
 * Migration script for social integrations tables
 * Run with: node scripts/migrate-social-integrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('rds.amazonaws.com')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log('🚀 Starting social integrations migration...');
    console.log(`📍 Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'local'}`);

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', '2024-10-31-social-integrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - oauth_accounts (OAuth credentials for all platforms)');
    console.log('  - tiktok_posts (TikTok video uploads)');
    console.log('  - instagram_accounts (Instagram Business/Creator accounts)');
    console.log('  - ig_media (Instagram posts, reels, stories)');
    console.log('  - ig_comments (Instagram comments)');
    console.log('  - webhook_events (Webhook events from all platforms)');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('oauth_accounts', 'tiktok_posts', 'instagram_accounts', 'ig_media', 'ig_comments', 'webhook_events')
      ORDER BY table_name
    `);

    console.log('\n✅ Verified tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check indexes
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('oauth_accounts', 'tiktok_posts', 'instagram_accounts', 'ig_media', 'ig_comments', 'webhook_events')
      ORDER BY tablename, indexname
    `);

    console.log(`\n📑 Created ${indexResult.rows.length} indexes for performance`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
