/**
 * Add ai_plan column to users table
 * 
 * Task: 17.3 Intégrer le système de plans et quotas
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { db as prisma } from '../lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

async function addAIPlanColumn() {
  console.log('🚀 Adding ai_plan column to users table...\n');

  try {
    // Execute migration statements one by one
    console.log('📝 Executing migration SQL...\n');

    // 1. Add ai_plan column
    console.log('  1. Adding ai_plan column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_plan VARCHAR(20) DEFAULT 'starter'
    `);
    console.log('     ✅ Column added\n');

    // 2. Add check constraint
    console.log('  2. Adding check constraint...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users ADD CONSTRAINT users_ai_plan_check 
        CHECK (ai_plan IN ('starter', 'pro', 'business'))
      `);
      console.log('     ✅ Constraint added\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('     ⚠️  Constraint already exists\n');
      } else {
        throw error;
      }
    }

    // 3. Create index
    console.log('  3. Creating index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_users_ai_plan ON users(ai_plan)
    `);
    console.log('     ✅ Index created\n');

    // 4. Update existing users
    console.log('  4. Updating existing users...');
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE users SET ai_plan = 'starter' WHERE ai_plan IS NULL
    `);
    console.log(`     ✅ Updated ${updateResult} users\n`);

    // 5. Add comment
    console.log('  5. Adding column comment...');
    await prisma.$executeRawUnsafe(`
      COMMENT ON COLUMN users.ai_plan IS 'AI usage plan tier: starter ($10/month), pro ($50/month), or business (unlimited)'
    `);
    console.log('     ✅ Comment added\n');

    console.log('✅ Migration executed successfully\n');

    // Verify the column was added
    console.log('🔍 Verifying ai_plan column...');
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'ai_plan'
    `;

    if (result.length > 0) {
      console.log('✅ ai_plan column exists\n');
    } else {
      console.log('❌ ai_plan column not found\n');
      process.exit(1);
    }

    // Check existing users
    const userCount = await prisma.users.count();
    const usersWithPlan = await prisma.users.count({
      where: { ai_plan: { not: null } },
    });

    console.log('📊 User Statistics:');
    console.log(`  - Total users: ${userCount}`);
    console.log(`  - Users with AI plan: ${usersWithPlan}`);
    console.log(`  - Users without AI plan: ${userCount - usersWithPlan}\n`);

    // Show plan distribution
    const planDistribution = await prisma.$queryRaw<
      Array<{ ai_plan: string; count: bigint }>
    >`
      SELECT ai_plan, COUNT(*) as count
      FROM users
      WHERE ai_plan IS NOT NULL
      GROUP BY ai_plan
      ORDER BY count DESC
    `;

    if (planDistribution.length > 0) {
      console.log('📈 Plan Distribution:');
      planDistribution.forEach(({ ai_plan, count }) => {
        console.log(`  - ${ai_plan}: ${count}`);
      });
      console.log('');
    }

    console.log('🎉 ai_plan column added successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run E2E tests: ./scripts/test-ai-e2e.sh');
    console.log('  2. Update user plans as needed');
    console.log('  3. Monitor AI usage and costs');

  } catch (error) {
    console.error('❌ Error adding ai_plan column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addAIPlanColumn();
