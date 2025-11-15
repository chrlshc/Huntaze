/**
 * Test Database Management
 * 
 * Manages test database state and cleanup
 */

export interface TestDatabase {
  users: Map<string, any>;
  content: Map<string, any>;
  messages: Map<string, any>;
  sessions: Map<string, any>;
  campaigns: Map<string, any>;
  revenue: Map<string, any>;
}

let testDb: TestDatabase | null = null;

export function getTestDatabase(): TestDatabase {
  if (!testDb) {
    testDb = {
      users: new Map(),
      content: new Map(),
      messages: new Map(),
      sessions: new Map(),
      campaigns: new Map(),
      revenue: new Map(),
    };
  }
  return testDb;
}

export function clearTestDatabase(): void {
  if (testDb) {
    testDb.users.clear();
    testDb.content.clear();
    testDb.messages.clear();
    testDb.sessions.clear();
    testDb.campaigns.clear();
    testDb.revenue.clear();
  }
}

export function resetTestDatabase(): void {
  testDb = null;
}

/**
 * Seed test database with initial data
 */
export async function seedTestData(): Promise<void> {
  const db = getTestDatabase();
  
  // Seed test users
  db.users.set('test-user-1', {
    id: 'test-user-1',
    email: 'test1@example.com',
    name: 'Test User 1',
    role: 'creator',
    platforms: ['instagram', 'tiktok'],
    createdAt: new Date(),
  });
  
  db.users.set('test-user-2', {
    id: 'test-user-2',
    email: 'test2@example.com',
    name: 'Test User 2',
    role: 'creator',
    platforms: ['onlyfans'],
    createdAt: new Date(),
  });
}

/**
 * Clean up test data for a specific user
 */
export async function cleanupUserData(userId: string): Promise<void> {
  const db = getTestDatabase();
  
  // Remove user
  db.users.delete(userId);
  
  // Remove user's content
  for (const [key, value] of db.content.entries()) {
    if (value.userId === userId) {
      db.content.delete(key);
    }
  }
  
  // Remove user's messages
  for (const [key, value] of db.messages.entries()) {
    if (value.userId === userId) {
      db.messages.delete(key);
    }
  }
  
  // Remove user's sessions
  for (const [key, value] of db.sessions.entries()) {
    if (value.userId === userId) {
      db.sessions.delete(key);
    }
  }
  
  // Remove user's campaigns
  for (const [key, value] of db.campaigns.entries()) {
    if (value.userId === userId) {
      db.campaigns.delete(key);
    }
  }
  
  // Remove user's revenue data
  for (const [key, value] of db.revenue.entries()) {
    if (value.userId === userId) {
      db.revenue.delete(key);
    }
  }
}
