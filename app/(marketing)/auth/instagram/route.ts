import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Bridge pretty route to API route
  const url = new URL('/api/auth/instagram', request.url);
  return NextResponse.redirect(url);
}

