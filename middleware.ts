import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const res = NextResponse.next();
  const rid = req.headers.get('x-request-id') || (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  res.headers.set('X-Request-Id', rid);
  return res;
}
