import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { revisionsRepository } from '@/lib/db/repositories/revisionsRepository';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

export async function GET(
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

    return NextResponse.json({ revision });
  } catch (error) {
    console.error('Error fetching revision:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revision' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await revisionsRepository.delete(revisionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting revision:', error);
    return NextResponse.json(
      { error: 'Failed to delete revision' },
      { status: 500 }
    );
  }
}