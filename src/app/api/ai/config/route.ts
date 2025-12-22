import { NextRequest, NextResponse } from 'next/server';
import { callAzureAI } from '@/lib/ai/providers/azure-ai';

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

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI configuration based on user plan (simplified)
    const config = {
      models: {
        primary: 'phi4', // Fast for real-time
        analysis: 'deepseek', // Deep for analysis
        fallback: 'llama'
      },
      features: {
        smartReplies: true,
        contentGeneration: true,
        analytics: true,
        campaignOptimization: true
      },
      limits: {
        messagesPerMonth: 5000,
        campaignsPerMonth: 50,
        analyticsReports: 100
      },
      azureEndpoints: {
        deepseek: !!process.env.AZURE_DEEPSEEK_ENDPOINT,
        phi4: !!process.env.AZURE_PHI4_ENDPOINT,
        llama: !!process.env.AZURE_LLAMA_ENDPOINT
      }
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('AI config error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI configuration' },
      { status: 500 }
    );
  }
}
