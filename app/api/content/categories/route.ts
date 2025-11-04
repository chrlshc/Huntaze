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

    // Get category distribution for user's content
    const result = await query(
      `SELECT 
        category,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count
       FROM content_items
       WHERE user_id = $1 AND category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, category } = body;

    if (!contentId || !category) {
      return NextResponse.json(
        { error: 'Content ID and category are required' },
        { status: 400 }
      );
    }

    const validCategories = [
      'promotional',
      'educational',
      'entertainment',
      'engagement',
      'announcement',
      'behind-the-scenes',
      'user-generated',
      'seasonal'
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE content_items SET category = $1, updated_at = NOW() WHERE id = $2',
      [category, contentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}
