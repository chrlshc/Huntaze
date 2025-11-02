import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/index';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, expiresIn = 7 } = body; // Default 7 days

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Check if content exists
    const contentCheck = await query(
      'SELECT id, user_id FROM content_items WHERE id = $1',
      [contentId]
    );

    if (contentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Generate unique preview token
    const previewToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Store preview link in metadata
    await query(
      `UPDATE content_items 
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{preview_token}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify({ token: previewToken, expires_at: expiresAt.toISOString() }), contentId]
    );

    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${previewToken}`;

    return NextResponse.json({
      success: true,
      previewUrl,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error creating preview link:', error);
    return NextResponse.json(
      { error: 'Failed to create preview link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Remove preview token from metadata
    await query(
      `UPDATE content_items 
       SET metadata = metadata - 'preview_token'
       WHERE id = $1`,
      [contentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Preview link revoked'
    });
  } catch (error) {
    console.error('Error revoking preview link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke preview link' },
      { status: 500 }
    );
  }
}
