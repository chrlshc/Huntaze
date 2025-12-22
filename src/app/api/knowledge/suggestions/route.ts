import { NextRequest, NextResponse } from 'next/server';
import { knowledgeRetrieval } from '@/lib/knowledge/retrieval';

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
    const { fanMessage, userId, niche } = body;

    // Search for relevant chat closer plays
    const results = await knowledgeRetrieval.findChatCloserPlays(
      fanMessage,
      parseInt(userId) || 1,
      niche || 'lifestyle'
    );

    // Transform results into suggested replies
    const suggestions = results.map(item => {
      const payload = item.payload as any;
      let suggestedText = payload?.response || payload?.outputText || "Hey! Thanks for your message 😘";
      
      // Simple personalization
      if (fanMessage.toLowerCase().includes('how much') || fanMessage.toLowerCase().includes('price')) {
        suggestedText = suggestedText.includes('$') ? suggestedText : `${suggestedText} 💕`;
      }
      
      return {
        id: item.id,
        text: suggestedText,
        confidence: Math.max(0.5, 1 - item.distance), // Convert distance to confidence
        source: item.inputText
      };
    });

    return NextResponse.json({
      suggestions: suggestions.slice(0, 3) // Return top 3
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
