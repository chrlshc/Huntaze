'use server';

import { NextResponse } from 'next/server';

// Minimal stub to satisfy typechecker; real handler lives in NextAuth callbacks.
export async function GET() {
  return NextResponse.json({ ok: true });
}
