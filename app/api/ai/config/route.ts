import { NextRequest, NextResponse } from 'next/server';
import { AIConfigsRepository } from '@/lib/db/repositories';
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

    const config = await AIConfigsRepository.getConfig(userId);
    
    // Return default config if none exists
    if (!config) {
      return NextResponse.json({
        personality: '',
        responseStyle: 'friendly',
        tone: 'casual',
        responseLength: 'medium',
        pricing: {
          monthlyPrice: '9.99',
          welcomeMessage: '',
        },
        platforms: [],
        customResponses: [],
        enabled: true
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch AI config:', error);
    return NextResponse.json({ error: 'Failed to fetch AI config' }, { status: 500 });
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
    
    const config = await request.json();
    const saved = await AIConfigsRepository.upsertConfig(userId, config);
    return NextResponse.json({ success: true, config: saved });
  } catch (error) {
    console.error('Failed to save AI config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
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

    const config = await request.json();
    const saved = await AIConfigsRepository.upsertConfig(userId, config);
    return NextResponse.json({ success: true, config: saved });
  } catch (error) {
    console.error('Failed to save AI config:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
