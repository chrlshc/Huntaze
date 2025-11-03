import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

// GET /api/content/collaborate/[token] - Get invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    // Get invitation details by token
    const invitation = await contentItemsRepository.getInvitationByToken(token);
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation already processed',
        status: invitation.status 
      }, { status: 400 });
    }

    // Check if invitation is expired (7 days)
    const expiryDate = new Date(invitation.created_at);
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    if (new Date() > expiryDate) {
      await contentItemsRepository.updateInvitationStatus(invitation.id, 'expired');
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        contentTitle: invitation.content.title,
        contentType: invitation.content.type,
        inviterName: invitation.inviter.name,
        inviterEmail: invitation.inviter.email,
        permission: invitation.permission,
        message: invitation.message,
        createdAt: invitation.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}

// POST /api/content/collaborate/[token] - Accept/decline invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = params.token;
    const body = await request.json();
    
    const validation = acceptInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Get invitation details
    const invitation = await contentItemsRepository.getInvitationByToken(token);
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Invitation already processed',
        status: invitation.status 
      }, { status: 400 });
    }

    // Check if user email matches invitation
    if (invitation.email !== session.user.email) {
      return NextResponse.json({ error: 'Invitation not for this user' }, { status: 403 });
    }

    if (action === 'accept') {
      // Add user as collaborator
      await contentItemsRepository.acceptInvitation(invitation.id, session.user.id);
      
      return NextResponse.json({
        message: 'Invitation accepted successfully',
        contentId: invitation.content_id,
        redirectUrl: `/content/edit/${invitation.content_id}`
      });
    } else {
      // Decline invitation
      await contentItemsRepository.updateInvitationStatus(invitation.id, 'declined');
      
      return NextResponse.json({
        message: 'Invitation declined'
      });
    }

  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
}