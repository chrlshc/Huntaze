import { NextRequest, NextResponse } from 'next/server';
import { platformConnections } from '@/lib/services/platformConnections';
import { getUserFromRequest } from '@/lib/auth/request';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Basic write-rate limit
    const limited = rateLimit(request, { windowMs: 60_000, max: 20 });
    if (!limited.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.userId;

    const { username, apiKey } = await request.json();

    if (!username || !apiKey) {
      return NextResponse.json(
        { error: 'Username and API key are required' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Validate the API key with OnlyFans
    // 2. Encrypt the API key before storing
    // 3. Store in secure database

    // For demo, we'll simulate validation
    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
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
    return NextResponse.json({
      id: connection.id,
      platform: connection.platform,
      username: connection.username,
      isActive: connection.isActive,
      createdAt: connection.createdAt,
    });
  } catch (error) {
    console.error('Platform connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect platform' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

    return NextResponse.json({ connections: safeConnections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get connections' }, { status: 500 });
  }
}
