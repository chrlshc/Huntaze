import { NextRequest, NextResponse } from 'next/server'

export function requireInternalKey(req: NextRequest): NextResponse | null {
  const configured = process.env.HUNTAZE_INTERNAL_API_KEY
  if (!configured) return null // no guard configured

  const header = req.headers.get('x-huntaze-internal-key')
  if (!header || header !== configured) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return null
}

