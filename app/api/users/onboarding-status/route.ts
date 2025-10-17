import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { cookies } from 'next/headers';
import {
  getOnboarding,
  getOrInitStatus,
  mergeOnboarding,
} from '@/app/api/_store/onboarding';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
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
      const r = NextResponse.json({ ...snapshot.status, requestId });
      r.headers.set('X-Request-Id', requestId);
      return r;
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
        mergeOnboarding(token, { status: data });
        return NextResponse.json(data, { status: resp.status });
      }
    } catch (backendError: any) {
      log.warn('onboarding_backend_unavailable', { error: backendError?.message || 'unavailable' });
    }

    const status = getOrInitStatus(token);
    const r = NextResponse.json({ ...status, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to fetch onboarding status', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const r = NextResponse.json({ error: 'Not authenticated', requestId }, { status: 401 });
      r.headers.set('X-Request-Id', requestId);
      return r;
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
        // Merge local snapshot
        mergeOnboarding(token, { status: { ...(getOnboarding(token)?.status || {}), ...payload } });
        const r = NextResponse.json({ ...data, requestId }, { status: resp.status });
        r.headers.set('X-Request-Id', requestId);
        return r;
      }
    } catch (backendError: any) {
      log.warn('onboarding_backend_unavailable', { error: backendError?.message || 'unavailable' });
    }

    // Update local store for demo; merge to keep unspecified keys
    const merged = mergeOnboarding(token, { status: { ...(getOnboarding(token)?.status || {}), ...payload } });
    const r = NextResponse.json({ ...merged.status, requestId });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    const r = NextResponse.json({ error: 'Failed to update onboarding status', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
