import { NextRequest, NextResponse } from 'next/server';
import { assertMockEnabled } from '@/lib/config/mock-data';

interface ContentItem {
  id: string;
  title: string;
  scheduledAt?: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
  lastUpdateAt?: string;
  caption?: string;
  mediaUrl?: string;
  error?: string;
}

// Mock data store - in production, this would come from a database
const mockContent: Record<string, ContentItem> = {
  'c_001': {
    id: 'c_001',
    title: 'Reel: Hook + CTA',
    scheduledAt: new Date().toISOString(),
    platforms: ['tiktok', 'instagram'],
    status: 'processing',
    lastUpdateAt: new Date().toISOString(),
    caption: 'Ready to level up? Here\'s what you need to know... #creator #growth',
    mediaUrl: 'https://cdn.example.com/videos/reel_001.mp4',
  },
  'c_002': {
    id: 'c_002',
    title: 'Story: Proof social',
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    platforms: ['instagram'],
    status: 'scheduled',
    lastUpdateAt: new Date().toISOString(),
    caption: 'Check out what our community is saying! 🔥',
    mediaUrl: 'https://cdn.example.com/images/story_002.jpg',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mockDisabled = assertMockEnabled('/api/marketing-war-room/content/[id]');
  if (mockDisabled) return mockDisabled;

  const { id } = await params;

  // Check mock data first
  if (mockContent[id]) {
    return NextResponse.json(mockContent[id]);
  }

  // Return a generated mock for any ID
  const content: ContentItem = {
    id,
    title: `Content ${id}`,
    scheduledAt: new Date().toISOString(),
    platforms: ['tiktok', 'instagram'],
    status: 'scheduled',
    lastUpdateAt: new Date().toISOString(),
    caption: 'Sample caption for this content...',
    mediaUrl: `https://cdn.example.com/media/${id}`,
  };

  return NextResponse.json(content);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mockDisabled = assertMockEnabled('/api/marketing-war-room/content/[id]');
  if (mockDisabled) return mockDisabled;

  try {
    const { id } = await params;
    const body = await request.json();

    // In production, update the database
    // For now, just return success
    const updatedContent: ContentItem = {
      id,
      title: mockContent[id]?.title || `Content ${id}`,
      scheduledAt: mockContent[id]?.scheduledAt || new Date().toISOString(),
      platforms: mockContent[id]?.platforms || ['tiktok', 'instagram'],
      status: mockContent[id]?.status || 'scheduled',
      lastUpdateAt: new Date().toISOString(),
      caption: body.caption || mockContent[id]?.caption || '',
      mediaUrl: mockContent[id]?.mediaUrl,
    };

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
