/**
 * GET /api/of-messages/status
 * 
 * Route test à un chemin différent pour diagnostiquer le problème.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Alternative path test',
    timestamp: new Date().toISOString()
  });
}
