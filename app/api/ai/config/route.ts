import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Simple in-memory store keyed by auth token for demo/dev
const aiConfigs = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);

    // Try in-memory first
    const existing = aiConfigs.get(token);
    if (existing) {
      return NextResponse.json(existing);
    }

    // TODO: Fetch config from database
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
    return NextResponse.json(defaultConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    
    const config = await request.json();
    // TODO: Save config to database
    console.log('Saving AI config for user:', (payload as any)?.userId, config);
    aiConfigs.set(token, config);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    await jwtVerify(token, secret);

    const config = await request.json();
    aiConfigs.set(token, config);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
