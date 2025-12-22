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
    const { conversationId, reason, priority } = body;

    // Use Phi-4 for escalation (faster and cheaper than DeepSeek)
    const systemPrompt = `Tu es un gestionnaire de communauté senior pour OnlyFans.
Ta tâche: Analyser une conversation qui nécessite une escalation et générer:
1. Un résumé de la situation
2. La raison de l'escalation
3. Une action recommandée
4. Le niveau d'urgence

Sois concis et professionnel.`;

    const response = await callAzureAI({
      model: 'phi4', // Use Phi-4 for faster processing
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Conversation ID: ${conversationId}\nRaison: ${reason || 'Non spécifiée'}\nPriorité: ${priority || 'normale'}\n\nAnalyse et recommande une action.` }
      ],
      temperature: 0.3,
      maxTokens: 300,
    });

    // Here you would typically:
    // 1. Log the escalation
    // 2. Notify human moderator
    // 3. Update conversation status in database

    return NextResponse.json({
      escalated: true,
      conversation_id: conversationId,
      analysis: response.content.trim(),
      escalated_at: new Date().toISOString(),
      assigned_to: 'human_moderator',
    });

  } catch (error) {
    console.error('AI escalate error:', error);
    return NextResponse.json(
      { error: 'Failed to escalate conversation' },
      { status: 500 }
    );
  }
}
