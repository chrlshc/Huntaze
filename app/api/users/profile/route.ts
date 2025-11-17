import { NextRequest, NextResponse } from 'next/server';
import { UserProfilesRepository } from '@/lib/db/repositories';
import { requireAuth } from '@/lib/auth/api-protection';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const userId = parseInt(authResult.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const profile = await UserProfilesRepository.getProfile(userId);
    
    // Return default if no profile exists yet
    if (!profile) {
      return NextResponse.json({
        displayName: '',
        bio: '',
        timezone: '',
        niche: '',
        goals: []
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const userId = parseInt(authResult.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const payload = await request.json();
    const profile = await UserProfilesRepository.upsertProfile(userId, payload);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;

    const userId = parseInt(authResult.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const payload = await request.json();
    const profile = await UserProfilesRepository.upsertProfile(userId, payload);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
