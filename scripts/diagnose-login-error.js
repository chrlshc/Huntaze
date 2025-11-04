#!/usr/bin/env node

/**
 * Direct diagnostic script to identify login error root cause
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    console.log('✅ Basic query successful');
    console.log(`   Timestamp: ${result.rows[0].timestamp}`);
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]}`);
    
    // Test users table
    try {
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Users table accessible (${userCount.rows[0].count} users)`);
    } catch (error) {
      console.log(`❌ Users table error: ${error.message}`);
    }
    
    // Test sessions table
    try {
      const sessionCount = await client.query('SELECT COUNT(*) as count FROM sessions');
      console.log(`✅ Sessions table accessible (${sessionCount.rows[0].count} sessions)`);
    } catch (error) {
      console.log(`❌ Sessions table error: ${error.message}`);
    }
    
    client.release();
    await pool.end();
    
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error details: ${error.detail || 'N/A'}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Testing environment variables...');
  
  const requiredVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'JWT_SECRET': process.env.JWT_SECRET,
    'NODE_ENV': process.env.NODE_ENV
  };
  
  let allValid = true;
  
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.log(`❌ ${varName}: Missing`);
      allValid = false;
    } else {
      // Mask sensitive values
      const displayValue = varName.includes('SECRET') || varName.includes('URL') 
        ? `${value.substring(0, 10)}...` 
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
      
      // Validate specific formats
      if (varName === 'DATABASE_URL' && !value.startsWith('postgres')) {
        console.log(`   ⚠️  Warning: DATABASE_URL should start with 'postgres://' or 'postgresql://'`);
      }
      if (varName === 'JWT_SECRET' && value === 'your-secret-key-change-in-production') {
        console.log(`   ⚠️  Warning: JWT_SECRET is using default value`);
        allValid = false;
      }
    }
  }
  
  return allValid;
}

async function testAuthComponents() {
  console.log('\n🔍 Testing authentication components...');
  
  try {
    // Test password hashing
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isValid) {
      console.log('✅ Password hashing/comparison working');
    } else {
      console.log('❌ Password hashing/comparison failed');
      return false;
    }
    
    // Test JWT (simplified test)
    const { SignJWT } = require('jose');
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    
    const token = await new SignJWT({ test: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(JWT_SECRET);
    
    if (token) {
      console.log('✅ JWT token generation working');
    } else {
      console.log('❌ JWT token generation failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Auth components test failed: ${error.message}`);
    return false;
  }
}

async function checkSmartOnboardingConflicts() {
  console.log('\n🔍 Checking Smart Onboarding integration conflicts...');
  
  // Check for potential conflicting environment variables
  const smartOnboardingVars = [
    'REDIS_URL',
    'WEBSOCKET_PORT',
    'ML_MODEL_ENDPOINT'
  ];
  
  let hasConflicts = false;
  
  smartOnboardingVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`ℹ️  Smart Onboarding var detected: ${varName}`);
    }
  });
  
  // Check if Smart Onboarding database tables exist
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      
      const client = await pool.connect();
      
      // Check for Smart Onboarding tables
      const smartTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%onboarding%' 
        OR table_name LIKE '%behavior%'
        OR table_name LIKE '%ml_%'
      `);
      
      if (smartTables.rows.length > 0) {
        console.log(`ℹ️  Smart Onboarding tables found: ${smartTables.rows.length}`);
        smartTables.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      } else {
        console.log('ℹ️  No Smart Onboarding tables detected');
      }
      
      client.release();
      await pool.end();
    } catch (error) {
      console.log(`⚠️  Could not check Smart Onboarding tables: ${error.message}`);
    }
  }
  
  return !hasConflicts;
}

async function main() {
  console.log('🚀 Login Error Diagnostic Tool');
  console.log('='.repeat(50));
  
  const results = {
    database: await testDatabaseConnection(),
    environment: await testEnvironmentVariables(),
    auth: await testAuthComponents(),
    smartOnboarding: await checkSmartOnboardingConflicts()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('='.repeat(50));
  
  const issues = [];
  
  if (!results.database) {
    issues.push('Database connection issues detected');
  }
  if (!results.environment) {
    issues.push('Environment variable configuration issues detected');
  }
  if (!results.auth) {
    issues.push('Authentication component issues detected');
  }
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n💡 RECOMMENDED ACTIONS:');
    if (!results.database) {
      console.log('  1. Check DATABASE_URL configuration');
      console.log('  2. Verify database server is accessible');
      console.log('  3. Check SSL configuration for production');
    }
    if (!results.environment) {
      console.log('  4. Set proper JWT_SECRET (not default value)');
      console.log('  5. Verify all required environment variables');
    }
    if (!results.auth) {
      console.log('  6. Check authentication dependencies');
      console.log('  7. Verify bcrypt and jose packages are installed');
    }
  } else {
    console.log('\n✅ All diagnostic tests passed!');
    console.log('\n💡 NEXT STEPS:');
    console.log('  1. The issue may be runtime-specific or staging environment related');
    console.log('  2. Check application logs in staging environment');
    console.log('  3. Test the actual login endpoint in staging');
    console.log('  4. Review recent deployment changes');
  }
  
  console.log('\n🏁 Diagnostic complete');
}

// Run the diagnostic
main().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});