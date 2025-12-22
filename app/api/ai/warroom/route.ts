import { NextRequest, NextResponse } from 'next/server';

interface WarroomRequest {
  mode: 'pack' | 'captions' | 'hooks' | 'repurpose' | 'triage';
  platform: 'all' | 'tt' | 'ig' | 'rd';
  ids: string[];
}

interface AIResultItem {
  id: string;
  title: string;
  hooks?: string[];
  captions?: string[];
  repurpose?: { summary: string };
  draft?: { caption: string };
}

export async function POST(request: NextRequest) {
  try {
    const body: WarroomRequest = await request.json();
    const { mode, platform, ids } = body;

    if (!ids?.length) {
      return NextResponse.json(
        { error: 'No content IDs provided' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual AI generation logic
    // This is a placeholder that returns mock data for demonstration
    const items: AIResultItem[] = ids.map((id) => {
      const platformLabel = {
        all: 'all platforms',
        tt: 'TikTok',
        ig: 'Instagram',
        rd: 'Reddit',
      }[platform];

      switch (mode) {
        case 'pack':
          return {
            id,
            title: `Content ${id}`,
            hooks: [
              `🔥 Hook 1 for ${platformLabel}: Stop scrolling! This changes everything...`,
              `💡 Hook 2 for ${platformLabel}: Nobody talks about this but...`,
            ],
            captions: [
              `Caption for ${platformLabel}: Ready to level up? Here's what you need to know... #creator #growth`,
              `Alt caption: The secret nobody shares about content creation 👀`,
            ],
            draft: {
              caption: `🔥 Stop scrolling! This changes everything...\n\nReady to level up? Here's what you need to know... #creator #growth`,
            },
          };

        case 'captions':
          return {
            id,
            title: `Content ${id}`,
            captions: [
              `Caption 1 for ${platformLabel}: Ready to transform your content game? Let's go! 🚀`,
              `Caption 2 for ${platformLabel}: This is what separates pros from amateurs...`,
              `Caption 3 for ${platformLabel}: Save this for later, you'll thank me 📌`,
            ],
          };

        case 'hooks':
          return {
            id,
            title: `Content ${id}`,
            hooks: [
              `🎯 Hook: "Wait, you're still doing it THAT way?"`,
              `⚡ Hook: "3 seconds to grab attention - here's how"`,
              `🔥 Hook: "POV: You finally figured it out"`,
              `💎 Hook: "The algorithm doesn't want you to see this"`,
            ],
          };

        case 'repurpose':
          return {
            id,
            title: `Content ${id}`,
            repurpose: {
              summary: `Repurpose plan for ${platformLabel}:\n• Cut 0-3s for hook\n• Add trending audio\n• Overlay text CTA at 5s\n• End with question for engagement\n• Cross-post to Stories with poll`,
            },
          };

        case 'triage':
          return {
            id,
            title: `Content ${id}`,
            draft: {
              caption: `Triage analysis:\n• Issue: Video format not supported\n• Fix: Re-encode to MP4 H.264\n• Next step: Re-upload and retry\n• Alternative: Use backup CDN URL`,
            },
          };

        default:
          return {
            id,
            title: `Content ${id}`,
            draft: { caption: 'No generation mode specified' },
          };
      }
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('AI Warroom error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
