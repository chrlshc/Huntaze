#!/usr/bin/env ts-node

/**
 * Test ElastiCache Redis Connection
 * 
 * This script tests the connection to AWS ElastiCache Redis
 * and verifies basic operations work correctly.
 */

import Redis from 'ioredis';

const ELASTICACHE_HOST = process.env.ELASTICACHE_REDIS_HOST || 'huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com';
const ELASTICACHE_PORT = parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379');

async function testElastiCacheConnection() {
  console.log('🔍 Testing ElastiCache Redis Connection...\n');
  console.log(`Host: ${ELASTICACHE_HOST}`);
  console.log(`Port: ${ELASTICACHE_PORT}\n`);

  const redis = new Redis({
    host: ELASTICACHE_HOST,
    port: ELASTICACHE_PORT,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('❌ Failed to connect after 3 retries');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      console.log(`⏳ Retry ${times} in ${delay}ms...`);
      return delay;
    },
  });

  try {
    // Test 1: PING
    console.log('Test 1: PING command...');
    const pong = await redis.ping();
    console.log(`✅ PING response: ${pong}\n`);

    // Test 2: SET/GET
    console.log('Test 2: SET/GET commands...');
    const testKey = 'test:connection:' + Date.now();
    await redis.set(testKey, 'Hello from Huntaze!');
    const value = await redis.get(testKey);
    console.log(`✅ SET/GET successful: ${value}\n`);

    // Test 3: INCR (for rate limiting)
    console.log('Test 3: INCR command (rate limiting)...');
    const counterKey = 'test:counter:' + Date.now();
    const count1 = await redis.incr(counterKey);
    const count2 = await redis.incr(counterKey);
    console.log(`✅ INCR successful: ${count1} -> ${count2}\n`);

    // Test 4: ZADD/ZCARD (for sliding window)
    console.log('Test 4: Sorted Set commands (sliding window)...');
    const zsetKey = 'test:zset:' + Date.now();
    await redis.zadd(zsetKey, Date.now(), 'member1');
    await redis.zadd(zsetKey, Date.now() + 1, 'member2');
    const zcard = await redis.zcard(zsetKey);
    console.log(`✅ ZADD/ZCARD successful: ${zcard} members\n`);

    // Test 5: EXPIRE
    console.log('Test 5: EXPIRE command...');
    await redis.expire(testKey, 60);
    const ttl = await redis.ttl(testKey);
    console.log(`✅ EXPIRE successful: TTL = ${ttl}s\n`);

    // Test 6: Pipeline (for atomic operations)
    console.log('Test 6: Pipeline commands...');
    const pipeline = redis.pipeline();
    pipeline.set('test:pipe:1', 'value1');
    pipeline.set('test:pipe:2', 'value2');
    pipeline.get('test:pipe:1');
    const results = await pipeline.exec();
    console.log(`✅ Pipeline successful: ${results?.length} commands executed\n`);

    // Cleanup
    console.log('Cleaning up test keys...');
    await redis.del(testKey, counterKey, zsetKey, 'test:pipe:1', 'test:pipe:2');
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All tests passed! ElastiCache Redis is working correctly.\n');
    console.log('You can now use the ElastiCache implementation for rate limiting:');
    console.log('  import { checkCreatorRateLimit } from "./lib/ai/rate-limit-elasticache";\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nPossible issues:');
    console.error('1. Network connectivity - Are you in the same VPC as ElastiCache?');
    console.error('2. Security groups - Does ElastiCache allow traffic from your IP/instance?');
    console.error('3. Endpoint - Is the hostname correct?');
    console.error('\nCurrent configuration:');
    console.error(`  Host: ${ELASTICACHE_HOST}`);
    console.error(`  Port: ${ELASTICACHE_PORT}`);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

// Run the test
testElastiCacheConnection().catch(console.error);
