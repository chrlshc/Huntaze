import { NextRequest, NextResponse } from 'next/server';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

interface ScriptRequest {
  idea: string;
  tiktokUrl?: string | null;
  targets: 'all' | 'tt' | 'ig' | 'rd';
  variants: number;
}

interface ScriptVariant {
  hook: string;
  body: string;
  cta: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScriptRequest = await request.json();
    const { idea, targets, variants = 3 } = body;

    if (!idea?.trim()) {
      return NextResponse.json(
        { error: 'Idea is required' },
        { status: 400 }
      );
    }

    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json({
        variants: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'empty',
        },
      });
    }

    // TODO: Replace with actual AI generation (Azure OpenAI, etc.)
    // This is a placeholder that returns mock data
    const platformHints: Record<string, string> = {
      all: 'multi-platform',
      tt: 'TikTok',
      ig: 'Instagram Reels',
      rd: 'Reddit',
    };

    const platformHint = platformHints[targets] || 'social media';

    const generatedVariants: ScriptVariant[] = [];

    for (let i = 0; i < Math.min(variants, 3); i++) {
      generatedVariants.push({
        hook: `🔥 [Variant ${i + 1}] "${idea}" - Stop scrolling! This changes everything for ${platformHint}...`,
        body: `Here's the thing about "${idea}" that nobody talks about:\n\n1. First, understand the core concept\n2. Then, apply it to your daily routine\n3. Finally, see the results in just 7 days\n\nThis is exactly what top creators do to stand out on ${platformHint}.`,
        cta: `💬 Comment "${idea.slice(0, 10).toUpperCase()}" if you want the full breakdown!\n\n👉 Follow for more tips like this\n🔗 Link in bio for the complete guide`,
      });
    }

    return NextResponse.json({ variants: generatedVariants });
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
