// Minimal placeholder schema for local builds
// Replace with real Drizzle schema in production
export const of_fans = {
  accountId: '' as any,
  onlyfansId: '' as any,
  username: '' as any,
  lifetimeValue: 0 as any,
  createdAt: new Date() as any,
  metadata: {} as any,
} as any;

export const of_transactions = {
  accountId: '' as any,
  fanId: '' as any,
  amount: 0 as any,
  createdAt: new Date() as any,
} as any;

export const of_messages = {
  accountId: '' as any,
  fanId: '' as any,
  metadata: {} as any,
  createdAt: new Date() as any,
} as any;

export const of_accounts = {
  id: '' as any,
  metadata: {} as any,
} as any;
