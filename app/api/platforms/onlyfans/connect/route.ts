import { NextRequest, NextResponse } from 'next/server';
import { platformConnections } from '@/lib/services/platformConnections';
import { getUserFromRequest } from '@/lib/auth/request';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    // Basic write-rate limit
    const limited = rateLimit(request, { windowMs: 60_000, max: 20 });
    if (!limited.ok) {
      const rr = NextResponse.json({ error: 'Rate limit exceeded', requestId }, { status: 429 });
      rr.headers.set('X-Request-Id', requestId);
      return rr;
    }

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const userId = user.userId;

    const { username, apiKey } = await request.json();

    if (!username || !apiKey) {
      const r = NextResponse.json({ error: 'Username and API key are required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // In production, you would:
    // 1. Validate the API key with OnlyFans
    // 2. Encrypt the API key before storing
    // 3. Store in secure database

    // For demo, we'll simulate validation
    if (apiKey.length < 20) {
      const r = NextResponse.json({ error: 'Invalid API key format', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Create connection record
    const connection = {
      id: Math.random().toString(36).substring(7),
      userId,
      platform: 'onlyfans',
      username,
      apiKeyEncrypted: `encrypted_${apiKey.substring(0, 10)}...`, // Don't store plaintext!
      isActive: true,
      lastSyncAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store connection
    const userConnections = platformConnections.get(userId) || [];
    userConnections.push(connection);
    platformConnections.set(userId, userConnections);

    // Return safe connection info (without sensitive data)
    const r = NextResponse.json({
      id: connection.id,
      platform: connection.platform,
      username: connection.username,
      isActive: connection.isActive,
      createdAt: connection.createdAt,
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('platform_onlyfans_connect_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to connect platform', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }
    const userId = user.userId;

    // Get user connections
    const connections = platformConnections.get(userId) || [];
    
    // Return safe connection info
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      platform: conn.platform,
      username: conn.username,
      isActive: conn.isActive,
      lastSyncAt: conn.lastSyncAt,
      createdAt: conn.createdAt,
    }));

    const r = NextResponse.json({ connections: safeConnections, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to get connections', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
