import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { assertMockEnabled } from '@/lib/config/mock-data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const mockDisabled = assertMockEnabled('/api/of/login/start');
  if (mockDisabled) return mockDisabled;

  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Mock login response for development
    const mockResponse = {
      success: true,
      message: 'Login initiated successfully',
      sessionId: `session_${Date.now()}`,
      status: 'pending'
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error starting login:', error);
    return NextResponse.json(
      { error: 'Failed to start login process' },
      { status: 500 }
    );
  }
}
