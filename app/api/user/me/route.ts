import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const auth = await getServerAuth();
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Return user information (sanitized)
  return NextResponse.json({
    userId: auth.userId,
    username: auth.username,
    groups: auth.groups,
    // Never expose sensitive data like passwords, tokens, etc.
  });
}