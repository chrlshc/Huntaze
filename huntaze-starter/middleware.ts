import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  const requestId = headers.get('x-request-id') ?? randomUUID()
  headers.set('x-request-id', requestId)

  const response = NextResponse.next({ request: { headers } })
  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
