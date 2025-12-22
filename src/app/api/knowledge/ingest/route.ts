import { NextRequest, NextResponse } from 'next/server';
import { knowledgeIngestor, ScrapedMessage } from '@/workers/knowledge-ingestor';

// Simple auth check for internal API
function checkAuth(request: NextRequest): { userId: string } | null {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return { userId: '1' }; // Default system user
  }
  
  // Check for user ID in header (for development)
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, options } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validation des messages
    const validatedMessages: ScrapedMessage[] = messages.map((msg, index) => {
      if (!msg.text || typeof msg.text !== 'string') {
        throw new Error(`Message ${index}: text is required`);
      }
      if (typeof msg.isFromCreator !== 'boolean') {
        throw new Error(`Message ${index}: isFromCreator is required`);
      }
      if (typeof msg.tipAmount !== 'number') {
        throw new Error(`Message ${index}: tipAmount is required`);
      }
      
      return {
        id: msg.id || `msg_${Date.now()}_${index}`,
        text: msg.text,
        isFromCreator: msg.isFromCreator,
        tipAmount: msg.tipAmount,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        fanId: msg.fanId,
        responseTime: msg.responseTime,
      };
    });

    // Lancer l'ingestion
    const result = await knowledgeIngestor.ingestHistory(
      parseInt(auth.userId),
      validatedMessages,
      options
    );

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully processed ${result.successfulMessages} messages`,
    });

  } catch (error) {
    console.error('Knowledge ingestion error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = checkAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les statistiques
    const stats = await knowledgeIngestor.getKnowledgeStats(
      parseInt(auth.userId)
    );

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Knowledge stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge stats' },
      { status: 500 }
    );
  }
}
