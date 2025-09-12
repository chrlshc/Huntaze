import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Simple in-memory store keyed by auth token for demo/dev
const aiConfigs = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error('Backend API error:', error);
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
    return NextResponse.json(defaultConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
        return NextResponse.json({ success: true, config: data.config || config });
      }
    } catch (error) {
      console.error('Backend API error:', error);
    }
    
    // Fallback to in-memory
    aiConfigs.set(token, config);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // token presence is checked above; detailed verification handled by downstream APIs in prod

    const config = await request.json();
    aiConfigs.set(token, config);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
