import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { markCompleted } from '@/app/api/_store/onboarding';

export async function POST(request: NextRequest) {
  const authToken = cookies().get('auth_token')?.value || cookies().get('access_token')?.value;
  
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Attempt to update onboarding status in backend if configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      try {
        const resp = await fetch(`${apiUrl}/users/onboarding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            profileSetup: true,
            businessSetup: true,
            platformsSetup: true,
            aiSetup: true,
            planSetup: true,
            completed: true
          }),
        });
        if (!resp.ok) {
          // Log but continue to set local cookie for frontend gating
          console.warn('Backend onboarding update failed');
        }
      } catch (e) {
        console.log('Backend not reachable for onboarding completion');
      }
    }

    // Update local in-memory status for demo/dev
    try { markCompleted(authToken); } catch {}

    // Return a response that also sets the bypass cookie used by middleware
    const response = NextResponse.json({ success: true });
    response.cookies.set('onboarding_completed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
