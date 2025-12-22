import { NextRequest, NextResponse } from 'next/server';
import { askMajordome } from '@/lib/ai/majordome';

// Simple auth check
function checkAuth(request: NextRequest): { userId: string } | null {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return { userId: '1' };
  }
  
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return { userId };
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history, pending } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Call the Majordome orchestrator
    const result = await askMajordome(message, {
      userId: auth.userId,
      history,
      pending,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Majordome API error:', error);
    return NextResponse.json(
      { 
        type: 'ERROR',
        error: 'Failed to process request',
        message: 'Le Majordome a rencontré un problème technique.',
        details: error
      },
      { status: 500 }
    );
  }
}
