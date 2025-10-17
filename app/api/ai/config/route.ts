import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Simple in-memory store keyed by auth token for demo/dev
const aiConfigs = new Map<string, any>();

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Try in-memory first
    const existing = aiConfigs.get(token);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Try backend API
    try {
      const response = await fetch(`${API_URL}/ai/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        aiConfigs.set(token, data);
        const r = NextResponse.json({ ...data, requestId });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
    } catch (error: any) {
      log.error('ai_config_backend_error', { error: error?.message || 'unknown_error' });
    }

    // Return default config if backend fails
    const defaultConfig = {
      personality: '',
      responseStyle: 'friendly',
      pricing: {
        monthlyPrice: '9.99',
        welcomeMessage: '',
      },
      platforms: [] as string[],
      customResponses: [],
    };
    aiConfigs.set(token, defaultConfig);
    const r = NextResponse.json({ ...defaultConfig, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to fetch AI config', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = new URL(request.url);
  const log = makeReqLogger({ requestId, route: pathname, method: request.method });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    
    const config = await request.json();
    
    // Try to save to backend
    try {
      const response = await fetch(`${API_URL}/ai/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        aiConfigs.set(token, data.config || config);
        const r = NextResponse.json({ success: true, config: data.config || config, requestId });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
    } catch (error: any) {
      log.error('ai_config_backend_error', { error: error?.message || 'unknown_error' });
    }
    
    // Fallback to in-memory
    aiConfigs.set(token, config);
    const r = NextResponse.json({ success: true, config, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to save config', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // token presence is checked above; detailed verification handled by downstream APIs in prod

    const config = await request.json();
    aiConfigs.set(token, config);
    const r = NextResponse.json({ success: true, config, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to save config', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
