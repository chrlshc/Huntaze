/**
 * GET /api/onlyfans/messages/test
 * 
 * Route de test simple sans dépendances pour diagnostiquer le problème de build.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Test route without dependencies',
    timestamp: new Date().toISOString(),
    build: 'Build #91 test'
  });
}
