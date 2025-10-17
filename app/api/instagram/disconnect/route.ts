import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('instagram_access_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('instagram_user', '', { path: '/', maxAge: 0 });
  res.cookies.set('instagram_connected', '', { path: '/', maxAge: 0 });
  return res;
}

