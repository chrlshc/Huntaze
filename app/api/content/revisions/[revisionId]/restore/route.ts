import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { revisionsRepository } from '@/lib/db/repositories/revisionsRepository';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

export async function POST(
  request: NextRequest,
  { params }: { params: { revisionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const revisionId = params.revisionId;
    const revision = await revisionsRepository.getById(revisionId);
    
    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Check if user has access to the content
    const content = await contentItemsRepository.getById(revision.contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create a backup revision of current state before restoring
    const currentSnapshot = {
      text: content.text,
      status: content.status,
      scheduledAt: content.scheduledAt,
      metadata: content.metadata,
    };

    await revisionsRepository.create({
      contentId: revision.contentId,
      userId: session.user.id,
      snapshot: currentSnapshot,
      description: 'Backup before restore',
    });

    // Restore the content from the revision snapshot
    const restoredSnapshot = revision.snapshot;
    const updatedContent = await contentItemsRepository.update(revision.contentId, {
      text: restoredSnapshot.text || content.text,
      status: restoredSnapshot.status || content.status,
      scheduledAt: restoredSnapshot.scheduledAt || content.scheduledAt,
      metadata: restoredSnapshot.metadata || content.metadata,
    });

    // Create a revision for the restore action
    await revisionsRepository.create({
      contentId: revision.contentId,
      userId: session.user.id,
      snapshot: {
        text: updatedContent.text,
        status: updatedContent.status,
        scheduledAt: updatedContent.scheduledAt,
        metadata: updatedContent.metadata,
      },
      description: `Restored from revision: ${revision.description}`,
    });

    return NextResponse.json({ 
      success: true, 
      content: updatedContent,
      message: 'Content restored successfully'
    });
  } catch (error) {
    console.error('Error restoring revision:', error);
    return NextResponse.json(
      { error: 'Failed to restore revision' },
      { status: 500 }
    );
  }
}