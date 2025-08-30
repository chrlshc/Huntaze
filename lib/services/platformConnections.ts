// Simple in-memory platform connections store for dev/demo.
// In production, persist to a database.

export type PlatformConnection = {
  id: string;
  userId: string;
  platform: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | string;
  username?: string;
  isActive?: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const platformConnections = new Map<string, PlatformConnection[]>();

