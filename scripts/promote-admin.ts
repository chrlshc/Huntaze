/**
 * Promote User to Admin
 * 
 * Script to promote a user to admin role
 * 
 * Usage:
 *   npm run promote-admin <email>
 *   or
 *   npx tsx scripts/promote-admin.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToAdmin(email: string) {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      currentRole: user.role,
    });

    if (user.role === 'admin') {
      console.log(`✅ User is already an admin`);
      process.exit(0);
    }

    // Promote to admin
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`✅ Successfully promoted user to admin:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    console.log(`\n🎉 ${email} is now an administrator!`);
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function demoteFromAdmin(email: string) {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      currentRole: user.role,
    });

    if (user.role === 'user') {
      console.log(`✅ User is already a regular user`);
      process.exit(0);
    }

    // Demote to user
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: { role: 'user' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`✅ Successfully demoted user to regular user:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    console.log(`\n${email} is now a regular user.`);
  } catch (error) {
    console.error('❌ Error demoting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function listAdmins() {
  try {
    console.log('Fetching all admin users...\n');
    
    const admins = await prisma.users.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    if (admins.length === 0) {
      console.log('No admin users found.');
      process.exit(0);
    }

    console.log(`Found ${admins.length} admin user(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name || 'N/A'}`);
      console.log(`   Created: ${admin.created_at?.toISOString() || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing admins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

if (!command) {
  console.log(`
Admin User Management Script

Usage:
  npm run promote-admin <email>        - Promote user to admin
  npm run demote-admin <email>         - Demote admin to user
  npm run list-admins                  - List all admin users

Examples:
  npm run promote-admin admin@example.com
  npm run demote-admin user@example.com
  npm run list-admins
  `);
  process.exit(0);
}

if (command === 'list' || command === 'list-admins') {
  listAdmins();
} else if (command === 'demote' || command === 'demote-admin') {
  if (!email) {
    console.error('❌ Email required for demote command');
    console.log('Usage: npm run demote-admin <email>');
    process.exit(1);
  }
  demoteFromAdmin(email);
} else {
  // Default to promote
  const emailToPromote = command; // First arg is the email
  if (!emailToPromote || !emailToPromote.includes('@')) {
    console.error('❌ Valid email required');
    console.log('Usage: npm run promote-admin <email>');
    process.exit(1);
  }
  promoteToAdmin(emailToPromote);
}
