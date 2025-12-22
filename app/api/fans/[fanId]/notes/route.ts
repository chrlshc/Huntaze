/**
 * API Routes pour les notes des fans
 * 
 * GET    /api/fans/[fanId]/notes - Récupérer toutes les notes d'un fan
 * POST   /api/fans/[fanId]/notes - Créer une nouvelle note
 */

import { NextRequest, NextResponse } from 'next/server';
import { fanNotesService, NoteCategory } from '@/lib/fans/fan-notes.service';

// TODO: Remplacer par votre système d'auth
async function getCreatorId(_request: NextRequest): Promise<number | null> {
  // Pour le moment, retourne un ID fixe pour le dev
  // En prod, extraire de la session/JWT
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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as NoteCategory | null;

    const notes = await fanNotesService.getNotes({
      creatorId,
      fanId,
      ...(category && { category }),
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[API] Error fetching fan notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string }> }
) {
  try {
    const creatorId = await getCreatorId(request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fanId } = await params;
    const body = await request.json();

    const { category, content, fanUsername, source, confidence, metadata } = body;

    if (!category || !content) {
      return NextResponse.json(
        { error: 'category and content are required' },
        { status: 400 }
      );
    }

    const validCategories: NoteCategory[] = [
      'preferences',
      'interests',
      'personal',
      'purchase_behavior',
      'communication_style',
      'important',
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const note = await fanNotesService.createNote({
      creatorId,
      fanId,
      fanUsername,
      category,
      content,
      source: source || 'manual',
      confidence,
      metadata,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating fan note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
