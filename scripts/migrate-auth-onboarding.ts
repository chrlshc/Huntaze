#!/usr/bin/env ts-node

/**
 * Migration script for auth-onboarding-flow feature
 * Adds onboarding_completed column to users table
 * 
 * Usage:
 *   ts-node scripts/migrate-auth-onboarding.ts
 *   or
 *   npm run migrate:auth-onboarding
 */

import { query, getPool } from '../lib/db';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

async function runMigration(): Promise<MigrationResult> {
  console.log('==========================================');
  console.log('Auth Onboarding Flow - Database Migration');
  console.log('==========================================\n');

  try {
    // Check database connection
    console.log('📡 Checking database connection...');
    const pool = getPool();
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Step 1: Add column
    console.log('📝 Step 1: Adding onboarding_completed column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false
    `);
    console.log('✅ Column added\n');

    // Step 2: Backfill existing users
    console.log('📝 Step 2: Backfilling existing users...');
    const updateResult = await query(`
      UPDATE users 
      SET onboarding_completed = true 
      WHERE onboarding_completed IS NULL OR onboarding_completed = false
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing users\n`);

    // Step 3: Create index
    console.log('📝 Step 3: Creating index...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
      ON users(onboarding_completed)
    `);
    console.log('✅ Index created\n');

    // Verify migration
    console.log('📊 Verifying migration...\n');

    // Check column exists
    const columnCheck = await query(`
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `);

    if (columnCheck.rows.length === 0) {
      throw new Error('Column was not created');
    }

    console.log('Column details:');
    console.table(columnCheck.rows);

    // Check user counts
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users, 
        SUM(CASE WHEN onboarding_completed = true THEN 1 ELSE 0 END) as completed_onboarding,
        SUM(CASE WHEN onboarding_completed = false THEN 1 ELSE 0 END) as incomplete_onboarding
      FROM users
    `);

    console.log('\nUser statistics:');
    console.table(userStats.rows);

    // Check index exists
    const indexCheck = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed'
    `);

    if (indexCheck.rows.length === 0) {
      throw new Error('Index was not created');
    }

    console.log('\nIndex details:');
    console.table(indexCheck.rows);

    console.log('\n==========================================');
    console.log('✅ Migration Complete');
    console.log('==========================================\n');

    console.log('Next steps:');
    console.log('  1. Deploy backend changes (NextAuth config, API endpoints)');
    console.log('  2. Deploy frontend changes (auth page, onboarding page)');
    console.log('  3. Test registration and login flows\n');

    return {
      success: true,
      message: 'Migration completed successfully',
      details: {
        usersUpdated: updateResult.rowCount,
        columnCreated: true,
        indexCreated: true,
      },
    };
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTo rollback, run:');
    console.error('  psql $DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql\n');

    return {
      success: false,
      message: error.message,
    };
  } finally {
    // Close pool
    const pool = getPool();
    await pool.end();
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { runMigration };
