import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

/**
 * OnlyFans Stats API Route
 * Returns dashboard statistics for the OnlyFans page
 * 
 * Feature: onlyfans-shopify-design
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Before upstream data is connected, return an explicit "no data yet" payload.
    // The UI must handle this with empty/loading/error states (no mock numbers in prod).
    return NextResponse.json({
      success: true,
      stats: null,
      connection: {
        isConnected: false,
        lastSync: null,
        status: 'disconnected' as const,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch OnlyFans stats',
        stats: null,
      },
      { status: 500 }
    );
  }
}
