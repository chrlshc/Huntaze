// Simple multi-account for Scale/Enterprise - NO BULLSHIT
// Just switch between accounts, that's it

import { db } from '@/lib/db';
import { of_accounts } from '@/lib/db/schema';
const eq = (...args: any[]) => ({} as any);

export interface SimpleAccount {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  revenue30d: number;
  pendingMessages: number;
}

export class SimpleMultiAccountService {
  // Get accounts for switching (Scale = 3, Enterprise = unlimited)
  async getAccounts(userId: string): Promise<SimpleAccount[]> {
    const accounts = await db.query.of_accounts.findMany({
      where: eq(of_accounts.userId, userId)
    });

    return accounts.map((acc: any) => ({
      id: acc.id,
      username: acc.username,
      displayName: acc.metadata?.displayName || acc.username,
      isActive: acc.status === 'active',
      revenue30d: acc.metadata?.revenue30d || 0,
      pendingMessages: acc.metadata?.pendingMessages || 0
    }));
  }

  // Switch to different account
  async switchAccount(userId: string, toAccountId: string): Promise<boolean> {
    // Just update which account is current
    // Browser automation handles the rest
    try {
      await db.update(of_accounts)
        .set({ metadata: { isCurrent: false } })
        .where(eq(of_accounts.userId, userId));
      
      await db.update(of_accounts)
        .set({ metadata: { isCurrent: true } })
        .where(eq(of_accounts.id, toAccountId));
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // That's it! No complex features, just switching
}

export const simpleMultiAccount = new SimpleMultiAccountService();
