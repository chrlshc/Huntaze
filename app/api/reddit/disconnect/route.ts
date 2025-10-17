import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('reddit_access_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('reddit_refresh_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('reddit_user', '', { path: '/', maxAge: 0 });
  res.cookies.set('reddit_connected', '', { path: '/', maxAge: 0 });
  return res;
}

