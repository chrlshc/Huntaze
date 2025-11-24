import { NextResponse, NextRequest } from 'next/server';

// Keep matcher to apply basic middleware plumbing across API and debug routes.
export const config = {
  matcher: ['/api/:path*', '/debug/:path*'],
};

// Minimal middleware: we intentionally avoid pulling Node-only dependencies
// because middleware runs in the Edge runtime. Rate limiting and debug auth
// are temporarily disabled here to keep the build edge-safe.
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}
