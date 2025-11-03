import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';
import { z } from 'zod';
import { api } from '@/lib/api';

const addCollaboratorSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['owner', 'editor', 'viewer']),
  message: z.string().optional()
});

const updatePermissionSchema = z.object({
  permission: z.enum(['owner', 'editor', 'viewer'])
});

// GET /api/content/[id]/collaborators - List collaborators
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
    const content = await contentItemsRepository.findById(contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if user is owner or collaborator
    const hasAccess = await contentItemsRepository.checkUserAccess(
      contentId, 
      session.user.id
    );
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const collaborators = await contentItemsRepository.getCollaborators(contentId);
    
    return NextResponse.json({
      collaborators: collaborators.map(collab => ({
        id: collab.id,
        email: collab.user.email,
        name: collab.user.name,
        permission: collab.permission,
        addedAt: collab.created_at,
        status: collab.status // pending, accepted, declined
      }))
    });

  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

// POST /api/content/[id]/collaborators - Add collaborator
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
    
    // Validate request body
    const validation = addCollaboratorSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, permission, message } = validation.data;

    // Check if user is owner of this content
    const content = await contentItemsRepository.findById(contentId);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Only owner can add collaborators' }, { status: 403 });
    }

    // Check if user is trying to add themselves
    if (email === session.user.email) {
      return NextResponse.json({ error: 'Cannot add yourself as collaborator' }, { status: 400 });
    }

    // Add collaborator
    const collaborator = await contentItemsRepository.addCollaborator({
      contentId,
      email,
      permission,
      invitedBy: session.user.id,
      message
    });

    // Send invitation email
    try {
      const { CollaborationEmailService } = await import('@/lib/services/collaborationEmailService');
      await CollaborationEmailService.sendCollaborationInvite({
        to: email,
        contentTitle: content.title || 'Untitled Content',
        inviterName: session.user.name || session.user.email || 'Someone',
        permission,
        message,
        acceptUrl: `${process.env.NEXTAUTH_URL}/content/collaborate/${collaborator.token}`
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      message: 'Collaborator invited successfully',
      collaborator: {
        id: collaborator.id,
        email: collaborator.email,
        permission: collaborator.permission,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to add collaborator' },
      { status: 500 }
    );
  }
}
// P
ATCH /api/content/[id]/collaborators/[collaboratorId] - Update permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentId = params.id;
    const url = new URL(request.url);
    const collaboratorId = url.searchParams.get('collaboratorId');
    
    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updatePermissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { permission } = validation.data;

    // Check if user is owner
    const content = await contentItemsRepository.findById(contentId);
    if (!content || content.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Only owner can update permissions' }, { status: 403 });
    }

    // Update collaborator permission
    await contentItemsRepository.updateCollaboratorPermission(
      collaboratorId,
      permission
    );

    return NextResponse.json({
      message: 'Permission updated successfully'
    });

  } catch (error) {
    console.error('Error updating collaborator permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id]/collaborators/[collaboratorId] - Remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentId = params.id;
    const url = new URL(request.url);
    const collaboratorId = url.searchParams.get('collaboratorId');
    
    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID required' }, { status: 400 });
    }

    // Check if user is owner or removing themselves
    const content = await contentItemsRepository.findById(contentId);
    const collaborator = await contentItemsRepository.getCollaboratorById(collaboratorId);
    
    if (!content || !collaborator) {
      return NextResponse.json({ error: 'Content or collaborator not found' }, { status: 404 });
    }

    const isOwner = content.user_id === session.user.id;
    const isRemovingSelf = collaborator.user_id === session.user.id;

    if (!isOwner && !isRemovingSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Remove collaborator
    await contentItemsRepository.removeCollaborator(collaboratorId);

    return NextResponse.json({
      message: 'Collaborator removed successfully'
    });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}