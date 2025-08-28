import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// In-memory storage for demo (should use database)
const onboardingStatus = new Map();

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

    // Get onboarding status
    const status = onboardingStatus.get(userId) || {
      completed: false,
      currentStep: 'profile',
      steps: {
        profile: false,
        aiConfig: false,
        payment: false,
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
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
    
    // Get existing status
    const existingStatus = onboardingStatus.get(userId) || {
      completed: false,
      currentStep: 'profile',
      steps: {
        profile: false,
        aiConfig: false,
        payment: false,
      },
    };

    // Update status
    const updatedStatus = {
      ...existingStatus,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Check if all steps are completed
    if (updatedStatus.steps.profile && updatedStatus.steps.aiConfig && updatedStatus.steps.payment) {
      updatedStatus.completed = true;
    }

    // Save to storage
    onboardingStatus.set(userId, updatedStatus);

    return NextResponse.json(updatedStatus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}