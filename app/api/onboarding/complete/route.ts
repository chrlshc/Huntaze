import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const authToken = cookies().get('auth_token')?.value;
  
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Temporarily mark onboarding as complete
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/onboarding`, {
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

    if (!response.ok) {
      throw new Error('Failed to update onboarding status');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}