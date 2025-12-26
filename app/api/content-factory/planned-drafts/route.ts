import { NextRequest, NextResponse } from 'next/server';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

interface PlannedDraftsRequest {
  ideaId: string;
  ideaTitle: string;
  variants: number;
  targets: string[];
  script?: Array<{ hook?: string; body?: string; cta?: string }> | null;
  sendToMarketing: boolean;
}

function generateContentId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlannedDraftsRequest = await request.json();
    const { ideaId, ideaTitle, variants = 3, targets, script, sendToMarketing } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: 'ideaId is required' },
        { status: 400 }
      );
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json({
        success: false,
        ideaId,
        createdContentIds: [],
        status: 'not_implemented',
        message: 'Planned drafts are not available yet.',
      });
    }

    // Generate content IDs for planned drafts
    const createdContentIds: string[] = [];
    for (let i = 0; i < Math.min(variants, 3); i++) {
      createdContentIds.push(generateContentId());
    }

    // In production, this would:
    // 1. Create draft entries in the database with status "planned"
    // 2. Link them to the idea and script
    // 3. Add to the marketing queue if sendToMarketing is true

    console.log('Planned drafts created:', {
      ideaId,
      ideaTitle,
      variants,
      targets,
      hasScript: !!script,
      sendToMarketing,
      createdContentIds,
    });

    // Simulate adding to marketing queue
    if (sendToMarketing) {
      // In production: INSERT INTO content_queue (id, title, status, ...) VALUES ...
      console.log('Added to marketing queue:', createdContentIds);
    }

    return NextResponse.json({
      success: true,
      ideaId,
      createdContentIds,
      status: 'planned',
      message: sendToMarketing 
        ? 'Drafts created and added to Marketing queue'
        : 'Drafts created (not sent to Marketing)',
    });
  } catch (error) {
    console.error('Planned drafts error:', error);
    return NextResponse.json(
      { error: 'Failed to create planned drafts' },
      { status: 500 }
    );
  }
}
