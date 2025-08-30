import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  
  // Get all TikTok related cookies
  const accessToken = cookieStore.get('tiktok_access_token');
  const userCookie = cookieStore.get('tiktok_user');
  
  // Parse user data if exists
  let userData = null;
  if (userCookie?.value) {
    try {
      userData = JSON.parse(userCookie.value);
    } catch (e) {
      userData = { error: 'Failed to parse user cookie' };
    }
  }
  
  return NextResponse.json({
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.value?.length || 0,
    hasUserCookie: !!userCookie,
    userData: userData,
    cookies: {
      tiktok_access_token: accessToken ? 'exists' : 'missing',
      tiktok_user: userCookie ? 'exists' : 'missing',
    }
  });
}