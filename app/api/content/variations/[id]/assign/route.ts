import { NextRequest, NextResponse } from 'next/server';
import { assignVariation, validateVariationDistribution } from '@/lib/services/variationDistribution';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth/jwt';

/**
 * POST /api/content/variations/:id/assign
 * Assign a user to a variation
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const userId = authResult.payload.userId;
    const params = await context.params;
    const contentId = params.id;

    // Get content and variations
    const contentResult = await query(
      'SELECT * FROM content_items WHERE id = $1',
      [contentId]
    );

    if (contentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Get variations for this content
    const variationsResult = await query(
      'SELECT * FROM content_variations WHERE content_id = $1 AND is_active = true ORDER BY created_at',
      [contentId]
    );

    if (variationsResult.rows.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 active variations required for A/B testing' },
        { status: 400 }
      );
    }

    const variations = variationsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      percentage: row.distribution_percentage || 0,
      content: row.variation_data,
    }));

    // Validate distribution
    const validation = validateVariationDistribution(variations);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid variation distribution',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Check if user already has an assignment
    const existingAssignment = await query(
      'SELECT * FROM variation_assignments WHERE user_id = $1 AND content_id = $2',
      [userId, contentId]
    );

    let assignment;

    if (existingAssignment.rows.length > 0) {
      // Return existing assignment
      const existing = existingAssignment.rows[0];
      const variation = variations.find(v => v.id === existing.variation_id);
      
      assignment = {
        variationId: existing.variation_id,
        variationName: variation?.name || 'Unknown',
        assignedAt: existing.assigned_at,
        isNew: false,
      };
    } else {
      // Assign new variation
      const result = assignVariation(userId, contentId, variations);
      
      // Store assignment in database
      await query(
        `INSERT INTO variation_assignments (user_id, content_id, variation_id, assigned_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, contentId, result.variationId, result.assignedAt]
      );

      // Increment view count
      await query(
        'UPDATE content_variations SET views = views + 1 WHERE id = $1',
        [result.variationId]
      );

      assignment = {
        ...result,
        isNew: true,
      };
    }

    // Get the variation content
    const variationData = variations.find(v => v.id === assignment.variationId);

    return NextResponse.json({
      success: true,
      assignment,
      variation: variationData,
    });

  } catch (error) {
    console.error('Error assigning variation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to assign variation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
