/**
 * API Test Client
 * 
 * Provides a fetch-like interface that calls Next.js route handlers directly
 * instead of making real HTTP requests. This allows testing without starting
 * a server.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock fetch that calls route handlers directly
 */
export async function mockFetch(url: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Create NextRequest
  const request = new NextRequest(url, {
    method: init?.method || 'GET',
    headers: init?.headers as HeadersInit,
    body: init?.body,
  });
  
  // Route to appropriate handler
  let response: NextResponse;
  
  try {
    if (pathname === '/api/home/stats') {
      const { GET } = await import('@/app/api/home/stats/route');
      response = await GET(request);
    } else if (pathname === '/api/integrations/status') {
      const { GET } = await import('@/app/api/integrations/status/route');
      response = await GET(request);
    } else if (pathname === '/api/monitoring/metrics') {
      if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/monitoring/metrics/route');
        response = await OPTIONS();
      } else {
        const { GET } = await import('@/app/api/monitoring/metrics/route');
        response = await GET(request);
      }
    } else if (pathname === '/api/auth/register') {
      const { POST } = await import('@/app/api/auth/register/route');
      response = await POST(request);
    } else if (pathname === '/api/auth/login') {
      const { POST } = await import('@/app/api/auth/login/route');
      response = await POST(request);
    } else if (pathname === '/api/auth/logout') {
      const { POST } = await import('@/app/api/auth/logout/route');
      response = await POST(request);
    } else if (pathname === '/api/csrf/token') {
      const { GET } = await import('@/app/api/csrf/token/route');
      response = await GET(request);
    } else if (pathname.startsWith('/api/integrations/disconnect/')) {
      const { DELETE } = await import('@/app/api/integrations/disconnect/[provider]/[accountId]/route');
      // Extract params from pathname: /api/integrations/disconnect/{provider}/{accountId}
      const parts = pathname.split('/');
      const provider = parts[4];
      const accountId = parts[5];
      response = await DELETE(request, { params: { provider, accountId } });
    } else if (pathname.startsWith('/api/integrations/refresh/')) {
      const { POST } = await import('@/app/api/integrations/refresh/[provider]/[accountId]/route');
      // Extract params from pathname: /api/integrations/refresh/{provider}/{accountId}
      const parts = pathname.split('/');
      const provider = parts[4];
      const accountId = parts[5];
      response = await POST(request, { params: { provider, accountId } });
    } else if (pathname === '/api/onboarding/complete') {
      if (request.method === 'POST') {
        const { POST } = await import('@/app/api/onboarding/complete/route');
        response = await POST(request);
      } else if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/onboarding/complete/route');
        response = await OPTIONS(request);
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname.startsWith('/api/integrations/callback/')) {
      const { GET } = await import('@/app/api/integrations/callback/[provider]/route');
      // Extract params from pathname: /api/integrations/callback/{provider}
      const parts = pathname.split('/');
      const provider = parts[4];
      response = await GET(request, { params: { provider } });
    } else if (pathname === '/api/ai/chat') {
      if (request.method === 'POST') {
        const { POST } = await import('@/app/api/ai/chat/route');
        response = await POST(request);
      } else if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/ai/chat/route');
        response = await OPTIONS();
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/ai/generate-caption') {
      if (request.method === 'POST') {
        const { POST } = await import('@/app/api/ai/generate-caption/route');
        response = await POST(request);
      } else if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/ai/generate-caption/route');
        response = await OPTIONS();
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/ai/analyze-performance') {
      if (request.method === 'POST') {
        const { POST } = await import('@/app/api/ai/analyze-performance/route');
        response = await POST(request);
      } else if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/ai/analyze-performance/route');
        response = await OPTIONS();
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/ai/optimize-sales') {
      if (request.method === 'POST') {
        const { POST } = await import('@/app/api/ai/optimize-sales/route');
        response = await POST(request);
      } else if (request.method === 'OPTIONS') {
        const { OPTIONS } = await import('@/app/api/ai/optimize-sales/route');
        response = await OPTIONS();
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/ai/quota') {
      if (request.method === 'GET') {
        const { GET } = await import('@/app/api/ai/quota/route');
        response = await GET(request);
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/marketing-war-room/state') {
      if (request.method === 'GET') {
        const { GET } = await import('@/app/api/marketing-war-room/state/route');
        response = await GET();
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else if (pathname === '/api/onlyfans/fans') {
      if (request.method === 'GET') {
        const { GET } = await import('@/app/api/onlyfans/fans/route');
        response = await GET(request);
      } else {
        response = NextResponse.json(
          { error: 'Method Not Allowed' },
          { status: 405 }
        );
      }
    } else {
      // Return 404 for unknown routes
      response = NextResponse.json(
        { error: 'Not Found' },
        { status: 404 }
      );
    }
    
    // Convert NextResponse to Response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Mock fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Setup mock fetch globally
 */
export function setupMockFetch() {
  // Store original fetch
  const originalFetch = global.fetch;
  
  // Replace with mock
  global.fetch = mockFetch as any;
  
  // Return cleanup function
  return () => {
    global.fetch = originalFetch;
  };
}
