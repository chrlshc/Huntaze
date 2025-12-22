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

export async function POST(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignIds, metrics, timeframe } = body;

    // Use Phi-4 for fast marketing insights
    const systemPrompt = `Tu es un expert marketing pour OnlyFans.
Analyse les campagnes sélectionnées et fournis des recommandations actionnables pour:
1. Optimiser les taux de conversion
2. Améliorer l'engagement
3. Maximiser les revenus

Sois concis et orienté action.`;

    const response = await callAzureAI({
      model: 'phi4', // Fast insights for marketing
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Campagnes: ${JSON.stringify(campaignIds)}\nMétriques: ${JSON.stringify(metrics)}\nPériode: ${timeframe}\n\nGénère 3-5 recommandations concrètes.` }
      ],
      temperature: 0.5,
      maxTokens: 400,
    });

    const suggestions = response.content.split('\n').filter((s: string) => s.trim());

    return NextResponse.json({
      suggestions,
      insights: response.content,
      model: 'phi4',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI warroom error:', error);
    return NextResponse.json(
      { error: 'Failed to generate marketing insights' },
      { status: 500 }
    );
  }
}
