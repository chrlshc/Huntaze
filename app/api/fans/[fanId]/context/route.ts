/**
 * API Route pour le contexte complet d'un fan (pour l'IA)
 * 
 * GET /api/fans/[fanId]/context - Récupérer profil + notes formatées pour l'IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { fanNotesService } from '@/lib/fans/fan-notes.service';

// TODO: Remplacer par votre système d'auth
async function getCreatorId(_request: NextRequest): Promise<number | null> {
  return 1;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const creatorId = await getCreatorId(request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fanId } = await params;

    const context = await fanNotesService.getFanContextForAI(creatorId, fanId);

    return NextResponse.json(context);
  } catch (error) {
    console.error('[API] Error fetching fan context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fan context' },
      { status: 500 }
    );
  }
}
