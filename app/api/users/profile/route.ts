import { NextRequest, NextResponse } from 'next/server';
import { UserProfilesRepository } from '@/lib/db/repositories';
import { getUserFromRequest } from '@/lib/auth/request';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
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
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
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
    const user = await getUserFromRequest(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(user.userId, 10);
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
