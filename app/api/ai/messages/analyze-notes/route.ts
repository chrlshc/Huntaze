/**
 * API Route pour analyser un message et détecter des notes automatiquement
 * 
 * POST /api/ai/messages/analyze-notes
 * 
 * Body:
 * {
 *   fanId: string;
 *   fanUsername?: string;
 *   message: string;
 *   autoAdd?: boolean;  // true = ajouter automatiquement, false = juste détecter
 *   minConfidence?: number; // seuil minimum (0-1)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndAddNotes } from '@/lib/fans/auto-note-detector';

// TODO: Remplacer par votre système d'auth
async function getCreatorId(_request: NextRequest): Promise<number | null> {
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const creatorId = await getCreatorId(request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fanId, fanUsername, message, autoAdd = true, minConfidence = 0.8 } = body;

    if (!fanId || !message) {
      return NextResponse.json(
        { error: 'fanId and message are required' },
        { status: 400 }
      );
    }

    // Analyser le message et ajouter les notes
    const result = await analyzeAndAddNotes(
      creatorId,
      fanId,
      fanUsername,
      message,
      {
        minConfidence,
        autoAdd,
      }
    );

    return NextResponse.json({
      success: true,
      notesDetected: result.notesDetected,
      notesAdded: result.notesAdded,
      notes: result.notes,
    });
  } catch (error) {
    console.error('[API] Error analyzing message for notes:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
