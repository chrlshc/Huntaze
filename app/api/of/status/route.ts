'use server';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        of_auth_id: true,
        of_linked_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ connected: false }, { status: 404 });
    }

    return NextResponse.json({
      connected: !!user.of_auth_id && !!user.of_linked_at,
      linkedAt: user.of_linked_at?.toISOString() || null,
      authId: user.of_auth_id ? `${user.of_auth_id.slice(0, 4)}...` : null,
    });
  } catch (error) {
    console.error('[OF Status] Error:', error);
    return NextResponse.json({ connected: false, error: 'Internal error' }, { status: 500 });
  }
}
