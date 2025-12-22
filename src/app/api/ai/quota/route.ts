import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Simple auth check for internal API
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

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current AI usage from their plan
    // This is a simplified version - in production you'd track actual usage
    const quota = {
      used: 245, // Example: messages sent this month
      limit: 5000, // Based on user's plan
      remaining: 4755,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      plan: 'pro', // Get from user's actual plan
      features: {
        deepseek: !!process.env.AZURE_DEEPSEEK_ENDPOINT,
        phi4: !!process.env.AZURE_PHI4_ENDPOINT,
        llama: !!process.env.AZURE_LLAMA_ENDPOINT,
        knowledgeBase: true,
        smartReplies: true,
        contentGeneration: true
      }
    };

    return NextResponse.json(quota);
  } catch (error) {
    console.error('AI quota error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI quota' },
      { status: 500 }
    );
  }
}
