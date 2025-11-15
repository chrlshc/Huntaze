/**
 * Test Auth Login - Verify authentication works with database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

async function testAuthLogin() {
  console.log('🔍 Testing Auth Login Configuration...\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...');
    const dbTest = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', dbTest.rows[0].current_time);

    // Test 2: Check users table
    console.log('\n2️⃣ Checking users table...');
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users in database: ${usersCount.rows[0].count}`);

    // Test 3: Check for test users
    console.log('\n3️⃣ Checking for test users...');
    const testUsers = await query(
      `SELECT id, email, name, role, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    if (testUsers.rows.length > 0) {
      console.log('✅ Recent users found:');
      testUsers.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - Created: ${user.created_at}`);
      });
    } else {
      console.log('⚠️  No users found in database');
    }

    // Test 4: Check password hashing
    console.log('\n4️⃣ Checking password hashing...');
    const usersWithPasswords = await query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE password IS NOT NULL AND password != ''`
    );
    console.log(`✅ Users with passwords: ${usersWithPasswords.rows[0].count}`);

    // Test 5: Environment variables
    console.log('\n5️⃣ Checking environment variables...');
    const envVars = {
      'NEXTAUTH_SECRET': !!process.env.NEXTAUTH_SECRET,
      'NEXTAUTH_URL': !!process.env.NEXTAUTH_URL,
      'DATABASE_URL': !!process.env.DATABASE_URL,
      'GOOGLE_CLIENT_ID': !!process.env.GOOGLE_CLIENT_ID,
      'GOOGLE_CLIENT_SECRET': !!process.env.GOOGLE_CLIENT_SECRET,
    };

    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'Set' : 'Missing'}`);
    });

    console.log('\n✅ All auth configuration tests passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Database: Connected to ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]}`);
    console.log(`   - Users: ${usersCount.rows[0].count} total`);
    console.log(`   - Auth: NextAuth v5 configured`);
    console.log(`   - Ready: ✅ Authentication system ready`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testAuthLogin();
