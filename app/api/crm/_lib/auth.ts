import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getUserFromRequest } from '@/lib/auth/request';

type ResolvedAuth = {
  userId: number | null;
  source: 'session' | 'token' | 'none';
};

export async function resolveUserId(request: NextRequest): Promise<ResolvedAuth> {
  const session = await getSessionFromRequest(request);
  if (session?.user?.id) {
    const parsed = parseInt(session.user.id, 10);
    if (!Number.isNaN(parsed)) {
      return { userId: parsed, source: 'session' };
    }
  }

  const tokenUser = await getUserFromRequest(request);
  if (tokenUser?.userId) {
    const parsed = parseInt(tokenUser.userId, 10);
    if (!Number.isNaN(parsed)) {
      return { userId: parsed, source: 'token' };
    }
  }

  return { userId: null, source: 'none' };
}
