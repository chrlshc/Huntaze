#!/usr/bin/env tsx
/**
 * Test Database and Redis Connections
 * 
 * This script tests connectivity to Redis and Postgres during the build.
 * It helps diagnose connection issues in the Amplify build environment.
 */

import { getRedisClient, isRedisAvailable } from '../lib/redis-client';
import { getPrismaClient, isDatabaseAvailable } from '../lib/db-client';

async function testConnections() {
  console.log('🔍 Testing database connections...\n');

  // Test Redis
  console.log('📡 Testing Redis connection...');
  const redisAvailable = isRedisAvailable();
  
  if (redisAvailable) {
    const redis = getRedisClient();
    try {
      await redis!.ping();
      console.log('✅ Redis: Connected successfully');
    } catch (error) {
      console.error('❌ Redis: Connection failed:', error);
    }
  } else {
    console.warn('⚠️  Redis: Not available (will use fallback mode)');
  }

  console.log('');

  // Test Postgres
  console.log('📡 Testing Postgres connection...');
  const dbAvailable = isDatabaseAvailable();
  
  if (dbAvailable) {
    const prisma = getPrismaClient();
    try {
      await prisma!.$queryRaw`SELECT 1`;
      console.log('✅ Postgres: Connected successfully');
    } catch (error) {
      console.error('❌ Postgres: Connection failed:', error);
    }
  } else {
    console.warn('⚠️  Postgres: Not available (will use fallback mode)');
  }

  console.log('\n📊 Connection Summary:');
  console.log(`   Redis: ${redisAvailable ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`   Postgres: ${dbAvailable ? '✅ Available' : '❌ Unavailable'}`);

  if (!redisAvailable || !dbAvailable) {
    console.log('\n⚠️  Warning: Some services are unavailable.');
    console.log('   The application will run in fallback mode.');
    console.log('   This is expected during build time.');
  }

  process.exit(0);
}

testConnections().catch((error) => {
  console.error('❌ Connection test failed:', error);
  process.exit(0); // Don't fail the build
});
