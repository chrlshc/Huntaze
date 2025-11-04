import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get tag usage frequency
    const tagFrequency = await query(
      `SELECT 
        ct.tag,
        COUNT(*) as usage_count,
        COUNT(*) FILTER (WHERE ci.status = 'published') as published_count,
        MAX(ci.created_at) as last_used,
        MIN(ci.created_at) as first_used
       FROM content_tags ct
       JOIN content_items ci ON ct.content_id = ci.id
       WHERE ci.user_id = $1
       GROUP BY ct.tag
       ORDER BY usage_count DESC
       LIMIT 50`,
      [userId]
    );

    // Get tag combinations (tags that appear together)
    const tagCombinations = await query(
      `SELECT 
        t1.tag as tag1,
        t2.tag as tag2,
        COUNT(*) as co_occurrence
       FROM content_tags t1
       JOIN content_tags t2 ON t1.content_id = t2.content_id AND t1.tag < t2.tag
       JOIN content_items ci ON t1.content_id = ci.id
       WHERE ci.user_id = $1
       GROUP BY t1.tag, t2.tag
       HAVING COUNT(*) > 1
       ORDER BY co_occurrence DESC
       LIMIT 20`,
      [userId]
    );

    // Get tags by category
    const tagsByCategory = await query(
      `SELECT 
        ci.category,
        ct.tag,
        COUNT(*) as count
       FROM content_tags ct
       JOIN content_items ci ON ct.content_id = ci.id
       WHERE ci.user_id = $1 AND ci.category IS NOT NULL
       GROUP BY ci.category, ct.tag
       ORDER BY ci.category, count DESC`,
      [userId]
    );

    // Calculate tag cloud data (for visualization)
    const maxCount = tagFrequency.rows[0]?.usage_count || 1;
    const tagCloud = tagFrequency.rows.map(row => ({
      tag: row.tag,
      count: row.usage_count,
      weight: Math.ceil((row.usage_count / maxCount) * 10),
      publishedCount: row.published_count
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        tagFrequency: tagFrequency.rows,
        tagCombinations: tagCombinations.rows,
        tagsByCategory: tagsByCategory.rows,
        tagCloud
      }
    });
  } catch (error) {
    console.error('Error fetching tag analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tag analytics' },
      { status: 500 }
    );
  }
}
