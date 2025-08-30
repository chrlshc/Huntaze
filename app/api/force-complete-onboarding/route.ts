import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const authToken = cookies().get('auth_token')?.value;
  
  if (!authToken) {
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
    
    return response;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}