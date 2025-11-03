import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { commentsRepository } from '@/lib/db/repositories/commentsRepository';

export async function PUT(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.commentId;
    const body = await request.json();
    const { text, resolved } = body;

    // Get existing comment to check ownership
    const existingComment = await commentsRepository.getById(commentId);
    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only allow the comment author to edit text, but collaborators can resolve
    if (text !== undefined && existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (text !== undefined) {
      if (!text.trim()) {
        return NextResponse.json(
          { error: 'Comment text cannot be empty' },
          { status: 400 }
        );
      }
      updateData.text = text.trim();
    }
    if (resolved !== undefined) {
      updateData.resolved = resolved;
    }

    const comment = await commentsRepository.update(commentId, updateData);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.commentId;

    // Get existing comment to check ownership
    const existingComment = await commentsRepository.getById(commentId);
    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only allow the comment author to delete
    if (existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await commentsRepository.delete(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}