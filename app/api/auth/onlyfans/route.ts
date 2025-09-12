import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // OnlyFans doesn't have a public OAuth API yet
  // For demo purposes, we'll simulate the connection
  
  // In production, this would redirect to OnlyFans OAuth page
  // For now, we'll redirect back to onboarding with a success message
  
  const returnUrl = new URL('/onboarding/setup', request.url);
  returnUrl.searchParams.set('platform', 'onlyfans');
  returnUrl.searchParams.set('status', 'connected');
  
  return NextResponse.redirect(returnUrl);
}