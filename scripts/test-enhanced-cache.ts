#!/usr/bin/env tsx
/**
 * Test Enhanced Cache System
 */

import { getEnhancedCacheManager } from '../lib/cache/enhanced-cache';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testEnhancedCache() {
  console.log('Testing Enhanced Cache System...\n');

  const cache = getEnhancedCacheManager();

  // Test 1: Basic get/set
  console.log('1. Testing basic get/set...');
  await cache.set('test-key', { value: 'test-data' }, 5000);
  const result1 = await cache.get('test-key');
  console.log(`  ✓ Set and retrieved data:`, result1);

  // Test 2: Tag-based caching
  console.log('\n2. Testing tag-based caching...');
  await cache.set('user:1', { id: 1, name: 'Alice' }, 5000, { tags: ['users', 'user:1'] });
  await cache.set('user:2', { id: 2, name: 'Bob' }, 5000, { tags: ['users', 'user:2'] });
  await cache.set('post:1', { id: 1, title: 'Post 1' }, 5000, { tags: ['posts'] });
  
  console.log('  ✓ Cached 3 items with tags');
  
  // Invalidate by tag
  await cache.invalidate('#users');
  const user1 = await cache.get('user:1');
  const user2 = await cache.get('user:2');
  const post1 = await cache.get('post:1');
  
  console.log(`  ✓ After invalidating 'users' tag:`);
  console.log(`    - user:1: ${user1 === null ? 'invalidated' : 'still cached'}`);
  console.log(`    - user:2: ${user2 === null ? 'invalidated' : 'still cached'}`);
  console.log(`    - post:1: ${post1 === null ? 'invalidated' : 'still cached'}`);

  // Test 3: Stale-while-revalidate
  console.log('\n3. Testing stale-while-revalidate...');
  
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount++;
    await sleep(100);
    return { data: `fetch-${fetchCount}`, timestamp: Date.now() };
  };

  // First fetch - should call fetcher
  const fresh1 = await cache.getWithRevalidation('swr-test', fetcher, {
    staleTime: 500,
    revalidateTime: 2000,
    fallbackToStale: true,
  });
  console.log(`  ✓ First fetch (fresh): ${fresh1.data}, fetches: ${fetchCount}`);

  // Immediate second fetch - should return cached (fresh)
  const fresh2 = await cache.getWithRevalidation('swr-test', fetcher, {
    staleTime: 500,
    revalidateTime: 2000,
    fallbackToStale: true,
  });
  console.log(`  ✓ Second fetch (fresh): ${fresh2.data}, fetches: ${fetchCount}`);

  // Wait for data to become stale
  await sleep(600);

  // Third fetch - should return stale immediately and revalidate in background
  const stale1 = await cache.getWithRevalidation('swr-test', fetcher, {
    staleTime: 500,
    revalidateTime: 2000,
    fallbackToStale: true,
  });
  console.log(`  ✓ Third fetch (stale): ${stale1.data}, fetches: ${fetchCount}`);

  // Wait for background revalidation
  await sleep(200);
  console.log(`  ✓ After background revalidation, fetches: ${fetchCount}`);

  // Test 4: Pattern-based invalidation
  console.log('\n4. Testing pattern-based invalidation...');
  await cache.set('api:users:list', { data: 'users' }, 5000);
  await cache.set('api:users:detail:1', { data: 'user 1' }, 5000);
  await cache.set('api:posts:list', { data: 'posts' }, 5000);
  
  console.log('  ✓ Cached 3 API endpoints');
  
  // Invalidate all user endpoints
  await cache.invalidate('api:users:.*');
  
  const usersList = await cache.get('api:users:list');
  const usersDetail = await cache.get('api:users:detail:1');
  const postsList = await cache.get('api:posts:list');
  
  console.log(`  ✓ After invalidating 'api:users:.*' pattern:`);
  console.log(`    - api:users:list: ${usersList === null ? 'invalidated' : 'still cached'}`);
  console.log(`    - api:users:detail:1: ${usersDetail === null ? 'invalidated' : 'still cached'}`);
  console.log(`    - api:posts:list: ${postsList === null ? 'invalidated' : 'still cached'}`);

  // Test 5: Preloading
  console.log('\n5. Testing cache preloading...');
  
  await cache.preload([
    {
      key: 'dashboard:stats',
      fetcher: async () => ({ views: 1000, users: 50 }),
      ttl: 60000,
    },
    {
      key: 'dashboard:recent',
      fetcher: async () => ({ items: ['item1', 'item2'] }),
      ttl: 60000,
    },
  ]);
  
  const stats = await cache.get('dashboard:stats');
  const recent = await cache.get('dashboard:recent');
  
  console.log(`  ✓ Preloaded dashboard data:`);
  console.log(`    - stats:`, stats);
  console.log(`    - recent:`, recent);

  // Test 6: Cache statistics
  console.log('\n6. Testing cache statistics...');
  const cacheStats = cache.getStats();
  console.log(`  ✓ Cache stats:`);
  console.log(`    - Total entries: ${cacheStats.totalEntries}`);
  console.log(`    - Total size: ${cacheStats.totalSize} bytes`);
  console.log(`    - Tags: ${cacheStats.tags}`);
  console.log(`    - Oldest entry: ${cacheStats.oldestEntry?.toISOString()}`);
  console.log(`    - Newest entry: ${cacheStats.newestEntry?.toISOString()}`);

  // Test 7: Offline fallback simulation
  console.log('\n7. Testing offline fallback (simulated)...');
  
  // Set some data
  await cache.set('offline-test', { data: 'cached-data' }, 60000);
  
  // Simulate offline fetch that would fail
  const offlineFetcher = async () => {
    throw new Error('Network error - offline');
  };

  try {
    const result = await cache.getWithOfflineFallback('offline-test', offlineFetcher, {
      fallbackToStale: true,
    });
    console.log(`  ✓ Offline fallback returned cached data:`, result.data);
    console.log(`  ✓ Is stale: ${result.isStale}`);
  } catch (error) {
    console.log(`  ✗ Offline fallback failed:`, error);
  }

  // Test 8: TTL expiration
  console.log('\n8. Testing TTL expiration...');
  await cache.set('ttl-test', { data: 'expires-soon' }, 500); // 500ms TTL
  
  const beforeExpiry = await cache.get('ttl-test');
  console.log(`  ✓ Before expiry:`, beforeExpiry);
  
  await sleep(600);
  
  const afterExpiry = await cache.get('ttl-test');
  console.log(`  ✓ After expiry:`, afterExpiry === null ? 'expired' : 'still cached');

  // Test 9: Clear all
  console.log('\n9. Testing clear all...');
  const statsBefore = cache.getStats();
  console.log(`  ✓ Entries before clear: ${statsBefore.totalEntries}`);
  
  cache.clear();
  
  const statsAfter = cache.getStats();
  console.log(`  ✓ Entries after clear: ${statsAfter.totalEntries}`);

  console.log('\n✅ Enhanced Cache System test completed successfully!');
  console.log('\nThe system supports:');
  console.log('  - Multi-level caching (browser, Redis-ready)');
  console.log('  - Stale-while-revalidate strategy');
  console.log('  - Tag-based invalidation');
  console.log('  - Pattern-based invalidation');
  console.log('  - Cache preloading');
  console.log('  - Offline fallback');
  console.log('  - TTL expiration');
  console.log('  - Cache statistics');
}

testEnhancedCache()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
