import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { upstream } from '@/app/api/_lib/upstream';
import {
  getOnboarding,
  getOrInitStatus,
  mergeOnboarding,
} from '@/app/api/_store/onboarding';

// Use configured API base only; no localhost fallback

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // If cookie says completed, reflect it in local store snapshot
    const cookieCompleted = request.cookies.get('onboarding_completed')?.value === 'true';
    if (cookieCompleted) {
      const status = getOrInitStatus(token);
      if (!status.completed) {
        mergeOnboarding(token, { status: { ...status, completed: true, currentStep: 'completed' } });
      }
    }

    // Return stored snapshot if exists
    const snapshot = getOnboarding(token);
    if (snapshot?.status) {
      return NextResponse.json(snapshot.status);
    }

    // Try to fetch from backend
    try {
      const resp = await upstream('/users/onboarding-status', { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        mergeOnboarding(token, { status: data });
        return NextResponse.json(data, { status: resp.status });
      }
    } catch (backendError) {
      console.log('Backend not available, using default onboarding status');
    }

    const status = getOrInitStatus(token);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await request.json();

    // Try to update backend first
    try {
      const resp = await upstream('/users/onboarding-status', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        mergeOnboarding(token, { status: { ...(getOnboarding(token)?.status || {}), ...payload } });
        return NextResponse.json(data, { status: resp.status });
      }
    } catch (backendError) {
      console.log('Backend not available, updating local status only');
    }

    // Update local store for demo; merge to keep unspecified keys
    const merged = mergeOnboarding(token, { status: { ...(getOnboarding(token)?.status || {}), ...payload } });
    return NextResponse.json(merged.status);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}
