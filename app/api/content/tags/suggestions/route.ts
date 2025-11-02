import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentText, userId } = body;

    if (!contentText) {
      return NextResponse.json(
        { error: 'Content text is required' },
        { status: 400 }
      );
    }

    // Extract keywords from content (simple approach)
    const words = contentText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 3);

    const wordFrequency = words.reduce((acc: Record<string, number>, word: string) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    // Get top keywords
    const topKeywords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word]) => word);

    // Get user's most used tags
    let userTags: string[] = [];
    if (userId) {
      const result = await query(
        `SELECT tag, COUNT(*) as count
         FROM content_tags ct
         JOIN content_items ci ON ct.content_id = ci.id
         WHERE ci.user_id = $1
         GROUP BY tag
         ORDER BY count DESC
         LIMIT 10`,
        [userId]
      );
      userTags = result.rows.map(r => r.tag);
    }

    // Combine and deduplicate
    const suggestions = [...new Set([...topKeywords, ...userTags])].slice(0, 10);

    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate tag suggestions' },
      { status: 500 }
    );
  }
}
