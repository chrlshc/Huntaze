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
    const { fanMessage, fanData, persona, conversationId } = body;

    if (!fanMessage || !fanData) {
      return NextResponse.json(
        { error: 'fanMessage and fanData are required' },
        { status: 400 }
      );
    }

    // Build context for Azure AI
    const systemPrompt = `Tu es ${persona.name || 'une assistante IA'} pour OnlyFans.
Style guide: ${persona.style_guide || 'Friendly and seductive'}
Tones: ${persona.tone_keywords?.join(', ') || 'warm, playful'}

Fan data:
- Name: ${fanData.name}
- Segment: ${fanData.rfmSegment}
- Last active: ${fanData.lastActive}
- Total spent: $${fanData.totalSpent}
- Message count: ${fanData.messageCount}

Génère un message de réponse séduisant et personnel qui maximise les chances de conversion. Sois naturelle et authentique.`;

    // Use Phi-4 for fast real-time message generation
    const response = await callAzureAI({
      model: 'phi4', // Use Phi-4 for fast responses
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Fan message: "${fanMessage}"\n\nGénère une réponse parfaite pour ce fan.` }
      ],
      temperature: 0.7,
      maxTokens: 200,
    });

    return NextResponse.json({
      draft_message: response.content.trim(),
      model_used: 'deepseek',
      conversation_id: conversationId,
    });

  } catch (error) {
    console.error('AI draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate message draft' },
      { status: 500 }
    );
  }
}
