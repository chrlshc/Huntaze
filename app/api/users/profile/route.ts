import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// In-memory storage for demo (should use database)
const userProfiles = new Map();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Get user profile from storage
    const profile = userProfiles.get(userId) || {
      displayName: '',
      bio: '',
      timezone: '',
      onboardingCompleted: false,
      onboardingStep: 'profile',
    };

    return NextResponse.json(profile);
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
    const userId = payload.userId as string;

    const data = await request.json();
    
    // Get existing profile or create new one
    const existingProfile = userProfiles.get(userId) || {};
    
    // Update profile
    const updatedProfile = {
      ...existingProfile,
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    userProfiles.set(userId, updatedProfile);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}