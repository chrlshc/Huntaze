import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.huntaze.com/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Backend API (no local fallback in staging/prod)
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
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error('Backend API error:', error);
    }
    return NextResponse.json({ error: 'Failed to fetch AI config from upstream' }, { status: 502 });
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
    
    // Save to backend only (no local fallback)
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
        return NextResponse.json({ success: true, config: data.config || config });
      }
    } catch (error) {
      console.error('Backend API error:', error);
    }
    return NextResponse.json({ error: 'Failed to save AI config upstream' }, { status: 502 });
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
    const response = await fetch(`${API_URL}/ai/config`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, config: data.config || config });
    }
    return NextResponse.json({ error: 'Failed to update AI config upstream' }, { status: 502 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
