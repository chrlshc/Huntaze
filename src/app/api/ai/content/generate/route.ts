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
    const { type, prompt, context, tone = 'seductive' } = body;

    // Use Phi-4 for fast content generation
    const systemPrompt = `Tu es un expert en création de contenu pour OnlyFans.
Ton style: ${tone}
Type de contenu: ${type}

Génère du contenu captivant qui maximise l'engagement et les conversions.
Sois créatif, authentique et adapté à l'audience OnlyFans.`;

    const response = await callAzureAI({
      model: 'phi4', // Fast content generation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Contexte: ${context || ''}\nPrompt: ${prompt}\n\nGénère le contenu demandé.` }
      ],
      temperature: 0.8,
      maxTokens: 500,
    });

    return NextResponse.json({
      content: response.content.trim(),
      type,
      model: 'phi4',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
