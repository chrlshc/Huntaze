import { NextResponse } from 'next/server'

export async function POST() {
  // Placeholder rollup route. Wire to your DB when ready.
  // Intentionally no-op to avoid failures in environments without Prisma configured.
  return NextResponse.json({ ok: true, rows: 0, note: 'Rollup not configured (no DB adapter).'}, { status: 200 })
}

