import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { markCompleted } from '@/app/api/_store/onboarding';

export async function GET(req: Request) {
  const authToken = cookies().get('auth_token')?.value;
  const isDev = process.env.NODE_ENV !== 'production';
  const url = new URL(req.url);
  const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // In development or localhost, allow skipping without auth cookie
  if (!authToken && !(isDev || isLocalHost)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Force onboarding completion by creating a mock completed status
    const response = NextResponse.json({ 
      success: true, 
      message: 'Onboarding marked as complete' 
    });
    
    // Set a cookie to bypass onboarding check
    response.cookies.set('onboarding_completed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Update in-memory status (if token available)
    const token = cookies().get('access_token')?.value || cookies().get('auth_token')?.value || 'dev';
    if (token) {
      try { markCompleted(token); } catch {}
    }
    
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
