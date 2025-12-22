/**
 * API Routes pour une note spécifique
 * 
 * PATCH  /api/fans/[fanId]/notes/[noteId] - Mettre à jour une note
 * DELETE /api/fans/[fanId]/notes/[noteId] - Supprimer une note
 */

import { NextRequest, NextResponse } from 'next/server';
import { fanNotesService, NoteCategory } from '@/lib/fans/fan-notes.service';

// TODO: Remplacer par votre système d'auth
async function getCreatorId(_request: NextRequest): Promise<number | null> {
  return 1;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string; noteId: string }> }
) {
  try {
    const creatorId = await getCreatorId(request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    const body = await request.json();

    const { category, content, confidence, metadata } = body;

    const validCategories: NoteCategory[] = [
      'preferences',
      'interests',
      'personal',
      'purchase_behavior',
      'communication_style',
      'important',
    ];

    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const note = await fanNotesService.updateNote(noteId, {
      category,
      content,
      confidence,
      metadata,
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('[API] Error updating fan note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fanId: string; noteId: string }> }
) {
  try {
    const creatorId = await getCreatorId(request);
    if (!creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;

    await fanNotesService.deleteNote(noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting fan note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
