import { randomString, randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Generate random user data
export function generateUser() {
  const id = randomString(10);
  return {
    id: `user-${id}`,
    email: `test-${id}@example.com`,
    name: `Test User ${id}`,
    role: randomItem(['creator', 'admin']),
  };
}

// Generate random content data
export function generateContent(userId) {
  return {
    id: `content-${randomString(10)}`,
    userId,
    platform: randomItem(['instagram', 'tiktok', 'reddit', 'onlyfans']),
    type: randomItem(['post', 'story', 'reel', 'video']),
    caption: `Test content ${randomString(20)}`,
    status: randomItem(['draft', 'scheduled', 'published']),
    scheduledFor: new Date(Date.now() + randomIntBetween(3600000, 86400000)).toISOString(),
  };
}

// Generate random message data
export function generateMessage(userId) {
  return {
    id: `message-${randomString(10)}`,
    userId,
    fanId: `fan-${randomString(8)}`,
    content: `Test message ${randomString(30)}`,
    timestamp: new Date().toISOString(),
  };
}

// Generate random revenue data
export function generateRevenueData(userId) {
  return {
    userId,
    subscriptionPrice: randomIntBetween(5, 50),
    ppvPrice: randomIntBetween(10, 100),
    tipAmount: randomIntBetween(5, 500),
    month: new Date().toISOString().slice(0, 7),
  };
}

// Generate random campaign data
export function generateCampaign(userId) {
  return {
    id: `campaign-${randomString(10)}`,
    userId,
    name: `Test Campaign ${randomString(10)}`,
    type: randomItem(['promotion', 'announcement', 'engagement']),
    platforms: randomItem([
      ['instagram'],
      ['tiktok'],
      ['instagram', 'tiktok'],
      ['instagram', 'tiktok', 'reddit'],
    ]),
    status: randomItem(['draft', 'scheduled', 'active', 'completed']),
    startDate: new Date().toISOString(),
  };
}

// Generate batch of users
export function generateUsers(count = 10) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUser());
  }
  return users;
}

// Generate batch of content
export function generateContentBatch(userId, count = 5) {
  const content = [];
  for (let i = 0; i < count; i++) {
    content.push(generateContent(userId));
  }
  return content;
}

// Generate batch of messages
export function generateMessageBatch(userId, count = 10) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push(generateMessage(userId));
  }
  return messages;
}

// Generate realistic traffic pattern
export function generateTrafficPattern() {
  const hour = new Date().getHours();
  
  // Peak hours: 9-11 AM, 2-4 PM, 7-9 PM
  const peakHours = [9, 10, 11, 14, 15, 16, 19, 20, 21];
  const isPeakHour = peakHours.includes(hour);
  
  return {
    isPeakHour,
    multiplier: isPeakHour ? 2.5 : 1.0,
    expectedVus: isPeakHour ? 2500 : 1000,
  };
}

// Generate random API endpoint
export function generateRandomEndpoint() {
  const endpoints = [
    '/api/dashboard',
    '/api/content',
    '/api/messages/unified',
    '/api/revenue/pricing',
    '/api/revenue/forecast',
    '/api/marketing/campaigns',
    '/api/analytics',
  ];
  
  return randomItem(endpoints);
}

// Generate weighted random endpoint (more realistic distribution)
export function generateWeightedEndpoint() {
  const rand = Math.random();
  
  // Dashboard is accessed most frequently
  if (rand < 0.3) return '/api/dashboard';
  
  // Content and messages are accessed frequently
  if (rand < 0.5) return '/api/content';
  if (rand < 0.7) return '/api/messages/unified';
  
  // Revenue and analytics less frequently
  if (rand < 0.85) return '/api/revenue/pricing';
  if (rand < 0.95) return '/api/analytics';
  
  // Marketing least frequently
  return '/api/marketing/campaigns';
}

// Generate realistic user behavior pattern
export function generateUserBehavior() {
  const behaviors = [
    {
      name: 'content_creator',
      weight: 0.4,
      endpoints: ['/api/content', '/api/dashboard', '/api/analytics'],
      requestsPerMinute: 10,
    },
    {
      name: 'message_responder',
      weight: 0.3,
      endpoints: ['/api/messages/unified', '/api/dashboard'],
      requestsPerMinute: 15,
    },
    {
      name: 'revenue_optimizer',
      weight: 0.2,
      endpoints: ['/api/revenue/pricing', '/api/revenue/forecast', '/api/analytics'],
      requestsPerMinute: 5,
    },
    {
      name: 'marketer',
      weight: 0.1,
      endpoints: ['/api/marketing/campaigns', '/api/analytics', '/api/dashboard'],
      requestsPerMinute: 8,
    },
  ];
  
  const rand = Math.random();
  let cumulative = 0;
  
  for (const behavior of behaviors) {
    cumulative += behavior.weight;
    if (rand < cumulative) {
      return behavior;
    }
  }
  
  return behaviors[0];
}

// Generate think time (time between requests)
export function generateThinkTime(min = 1, max = 5) {
  return randomIntBetween(min, max);
}

// Generate realistic session duration
export function generateSessionDuration() {
  // Most sessions are 5-30 minutes
  return randomIntBetween(300, 1800);
}
