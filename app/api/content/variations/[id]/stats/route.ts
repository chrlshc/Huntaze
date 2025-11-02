import { NextRequest, NextResponse } from 'next/server';
import { calculateVariationStats, determineWinner } from '@/lib/services/variationDistribution';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth/jwt';

/**
 * GET /api/content/variations/:id/stats
 * Get performance statistics for all variations of a content item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentId = params.id;

    // Get all variations for this content
    const variationsResult = await query(
      `SELECT 
        id,
        name,
        distribution_percentage,
        views,
        engagements,
        is_active,
        created_at
       FROM content_variations 
       WHERE content_id = $1 
       ORDER BY created_at`,
      [contentId]
    );

    if (variationsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No variations found for this content' },
        { status: 404 }
      );
    }

    const variations = variationsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      distributionPercentage: row.distribution_percentage,
      views: row.views || 0,
      engagements: row.engagements || 0,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    // Calculate statistics
    const stats = calculateVariationStats(variations);

    // Determine winner
    const winner = determineWinner(variations);

    // Get event breakdown for each variation
    const eventsResult = await query(
      `SELECT 
        variation_id,
        event_type,
        COUNT(*) as count
       FROM variation_events
       WHERE variation_id = ANY($1)
       GROUP BY variation_id, event_type`,
      [variations.map(v => v.id)]
    );

    const eventsByVariation: Record<string, Record<string, number>> = {};
    eventsResult.rows.forEach(row => {
      if (!eventsByVariation[row.variation_id]) {
        eventsByVariation[row.variation_id] = {};
      }
      eventsByVariation[row.variation_id][row.event_type] = parseInt(row.count);
    });

    // Combine all data
    const detailedStats = stats.map(stat => ({
      ...stat,
      events: eventsByVariation[stat.id] || {},
      isWinner: winner.winnerId === stat.id,
    }));

    // Calculate total metrics
    const totalViews = variations.reduce((sum, v) => sum + v.views, 0);
    const totalEngagements = variations.reduce((sum, v) => sum + v.engagements, 0);
    const overallEngagementRate = totalViews > 0 
      ? (totalEngagements / totalViews) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      contentId,
      variations: detailedStats,
      winner: {
        ...winner,
        recommendation: winner.isSignificant 
          ? `Variation "${winner.winnerName}" is performing significantly better with ${winner.confidence}% confidence.`
          : 'Not enough data to determine a clear winner. Continue testing.',
      },
      summary: {
        totalVariations: variations.length,
        activeVariations: variations.filter(v => v.isActive).length,
        totalViews,
        totalEngagements,
        overallEngagementRate: Number(overallEngagementRate.toFixed(2)),
      },
    });

  } catch (error) {
    console.error('Error getting variation stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get variation statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
