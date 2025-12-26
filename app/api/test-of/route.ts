// app/api/test-of/route.ts
import { NextResponse } from 'next/server';
import { checkSessionStatus } from '@/lib/onlyfans/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId manquant. Usage: /api/test-of?userId=xxx' },
      { status: 400 }
    );
  }

  try {
    const status = await checkSessionStatus(userId);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
