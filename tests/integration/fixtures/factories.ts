/**
 * Test Data Factories
 * 
 * Factory functions for creating test data
 */

import { randomBytes } from 'crypto';

export type Platform = 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
export type UserRole = 'creator' | 'admin';
export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type ContentType = 'post' | 'story' | 'reel' | 'video';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  platforms: Platform[];
  createdAt: Date;
}

export interface TestContent {
  id: string;
  userId: string;
  platform: Platform;
  type: ContentType;
  status: ContentStatus;
  title?: string;
  description?: string;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt: Date;
}

export interface TestMessage {
  id: string;
  userId: string;
  fanId: string;
  content: string;
  platform: Platform;
  timestamp: Date;
  read: boolean;
}

export interface TestSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface TestCampaign {
  id: string;
  userId: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  targetAudience: string[];
  scheduledFor?: Date;
  createdAt: Date;
}

export interface TestRevenue {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  source: Platform;
  type: 'subscription' | 'tip' | 'ppv' | 'other';
  date: Date;
}

/**
 * Generate unique ID
 */
function generateId(prefix: string = 'test'): string {
  return `${prefix}-${randomBytes(8).toString('hex')}`;
}

/**
 * Generate test email
 */
function generateEmail(): string {
  return `test-${randomBytes(4).toString('hex')}@example.com`;
}

/**
 * Create test user
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: generateId('user'),
    email: generateEmail(),
    name: 'Test User',
    role: 'creator',
    platforms: ['instagram'],
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create test content
 */
export function createTestContent(overrides?: Partial<TestContent>): TestContent {
  return {
    id: generateId('content'),
    userId: generateId('user'),
    platform: 'instagram',
    type: 'post',
    status: 'draft',
    title: 'Test Content',
    description: 'Test content description',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create test message
 */
export function createTestMessage(overrides?: Partial<TestMessage>): TestMessage {
  return {
    id: generateId('message'),
    userId: generateId('user'),
    fanId: generateId('fan'),
    content: 'Test message content',
    platform: 'instagram',
    timestamp: new Date(),
    read: false,
    ...overrides,
  };
}

/**
 * Create test session
 */
export function createTestSession(overrides?: Partial<TestSession>): TestSession {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
  
  return {
    id: generateId('session'),
    userId: generateId('user'),
    token: `token-${randomBytes(16).toString('hex')}`,
    expiresAt,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create test campaign
 */
export function createTestCampaign(overrides?: Partial<TestCampaign>): TestCampaign {
  return {
    id: generateId('campaign'),
    userId: generateId('user'),
    name: 'Test Campaign',
    type: 'email',
    status: 'draft',
    targetAudience: [],
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create test revenue
 */
export function createTestRevenue(overrides?: Partial<TestRevenue>): TestRevenue {
  return {
    id: generateId('revenue'),
    userId: generateId('user'),
    amount: 100.00,
    currency: 'USD',
    source: 'instagram',
    type: 'subscription',
    date: new Date(),
    ...overrides,
  };
}

/**
 * Create multiple test users
 */
export function createTestUsers(count: number, overrides?: Partial<TestUser>): TestUser[] {
  return Array.from({ length: count }, () => createTestUser(overrides));
}

/**
 * Create multiple test content items
 */
export function createTestContents(count: number, overrides?: Partial<TestContent>): TestContent[] {
  return Array.from({ length: count }, () => createTestContent(overrides));
}

/**
 * Create multiple test messages
 */
export function createTestMessages(count: number, overrides?: Partial<TestMessage>): TestMessage[] {
  return Array.from({ length: count }, () => createTestMessage(overrides));
}

/**
 * Create multiple test campaigns
 */
export function createTestCampaigns(count: number, overrides?: Partial<TestCampaign>): TestCampaign[] {
  return Array.from({ length: count }, () => createTestCampaign(overrides));
}

/**
 * Create multiple test revenue items
 */
export function createTestRevenues(count: number, overrides?: Partial<TestRevenue>): TestRevenue[] {
  return Array.from({ length: count }, () => createTestRevenue(overrides));
}
