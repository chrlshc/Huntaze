import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// In-memory profile store keyed by auth token (dev/demo)
const profiles = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Prefer in-memory if available
    const existing = profiles.get(token);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Try backend, fall back to default
    try {
      const resp = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        cache: 'no-store',
      });
      if (resp.ok) {
        const data = await resp.json();
        profiles.set(token, data);
        return NextResponse.json(data, { status: resp.status });
      }
    } catch {}

    const defaultProfile = {
      displayName: '',
      bio: '',
      timezone: '',
    };
    profiles.set(token, defaultProfile);
    return NextResponse.json(defaultProfile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await request.json();
    // Try backend
    try {
      const resp = await fetch(`${API_URL}/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        profiles.set(token, data);
        return NextResponse.json(data, { status: resp.status });
      }
    } catch {}

    profiles.set(token, payload);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await request.json();
    try {
      const resp = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        profiles.set(token, data);
        return NextResponse.json(data, { status: resp.status });
      }
    } catch {}

    profiles.set(token, payload);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
