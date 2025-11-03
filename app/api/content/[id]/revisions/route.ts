import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { revisionsRepository } from '@/lib/db/repositories/revisionsRepository';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentId = params.id;
    
    // Check if user has access to this content
    const content = await contentItemsRepository.getById(contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // For now, allow access if user is owner or collaborator
    // TODO: Check collaborator permissions
    if (content.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const revisions = await revisionsRepository.getByContentId(contentId, limit);

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentId = params.id;
    const body = await request.json();
    const { snapshot, description } = body;

    if (!snapshot || !description) {
      return NextResponse.json(
        { error: 'Snapshot and description are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this content
    const content = await contentItemsRepository.getById(contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const revision = await revisionsRepository.create({
      contentId,
      userId: session.user.id,
      snapshot,
      description: description.trim(),
    });

    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    console.error('Error creating revision:', error);
    return NextResponse.json(
      { error: 'Failed to create revision' },
      { status: 500 }
    );
  }
}