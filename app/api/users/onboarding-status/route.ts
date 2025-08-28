import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// In-memory storage for demo (in production this would be in a database)
const onboardingStatus = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if we have a stored status for this session
    const storedStatus = onboardingStatus.get(token);
    if (storedStatus) {
      return NextResponse.json(storedStatus);
    }

    // Try to fetch from backend
    try {
      const resp = await fetch(`${API_URL}/users/onboarding-status`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        cache: 'no-store',
      });

      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
      }
    } catch (backendError) {
      console.log('Backend not available, using default onboarding status');
    }

    // Default onboarding status for new users
    const defaultStatus = {
      completed: false,
      currentStep: 'profile',
      steps: {
        profile: false,
        aiConfig: false,
        payment: false,
      }
    };

    // Store for this session
    onboardingStatus.set(token, defaultStatus);
    
    return NextResponse.json(defaultStatus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await request.json();

    // Try to update backend first
    try {
      const resp = await fetch(`${API_URL}/users/onboarding-status`, {
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
        // Also update local storage
        onboardingStatus.set(token, payload);
        return NextResponse.json(data, { status: resp.status });
      }
    } catch (backendError) {
      console.log('Backend not available, updating local status only');
    }

    // Update local storage for demo
    onboardingStatus.set(token, payload);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}
