import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Mark onboarding as completed
    const response = await fetch(new URL('/api/users/onboarding-status', request.url), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${token}`,
      },
      body: JSON.stringify({
        completed: true,
        currentStep: 'completed',
        steps: {
          profile: true,
          aiConfig: true,
          payment: true,
        }
      }),
    });

    if (response.ok) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.json({ error: 'Failed to bypass onboarding' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error bypassing onboarding:', error);
    return NextResponse.json({ error: 'Error occurred' }, { status: 500 });
  }
}