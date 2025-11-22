/**
 * Add role column to users table
 * 
 * Task: 12.3 Add admin authentication to AI costs endpoint
 */

import { db as prisma } from '../lib/prisma';

async function addRoleColumn() {
  console.log('🚀 Adding role column to users table...\n');

  try {
    // 1. Add role column
    console.log('  1. Adding role column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL
    `);
    console.log('     ✅ Column added\n');

    // 2. Create index
    console.log('  2. Creating index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);
    console.log('     ✅ Index created\n');

    console.log('✅ Migration executed successfully\n');

    // Verify the column was added
    console.log('🔍 Verifying role column...');
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'role'
    `;

    if (result.length > 0) {
      console.log('✅ role column exists\n');
    } else {
      console.log('❌ role column not found\n');
      process.exit(1);
    }

    // Check role distribution
    const roleDistribution = await prisma.$queryRaw<
      Array<{ role: string; count: bigint }>
    >`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE role IS NOT NULL
      GROUP BY role
      ORDER BY count DESC
    `;

    if (roleDistribution.length > 0) {
      console.log('📈 Role Distribution:');
      roleDistribution.forEach(({ role, count }) => {
        console.log(`  - ${role}: ${count}`);
      });
      console.log('');
    }

    console.log('🎉 role column added successfully!');

  } catch (error) {
    console.error('❌ Error adding role column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addRoleColumn();
