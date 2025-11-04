import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { variationName, text, mediaIds, audiencePercentage } = body;

    // Check if variation exists
    const variationCheck = await query(
      'SELECT parent_content_id, audience_percentage FROM content_variations WHERE id = $1',
      [id]
    );

    if (variationCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }

    const parentContentId = variationCheck.rows[0].parent_content_id;
    const currentPercentage = variationCheck.rows[0].audience_percentage;

    // If updating audience percentage, check total doesn't exceed 100%
    if (audiencePercentage !== undefined) {
      const totalPercentage = await query(
        'SELECT COALESCE(SUM(audience_percentage), 0) as total FROM content_variations WHERE parent_content_id = $1 AND id != $2',
        [parentContentId, id]
      );

      const otherTotal = parseInt(totalPercentage.rows[0].total);
      if (otherTotal + audiencePercentage > 100) {
        return NextResponse.json(
          { error: `Total audience percentage would exceed 100%` },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (variationName !== undefined) {
      updates.push(`variation_name = $${paramIndex}`);
      values.push(variationName);
      paramIndex++;
    }

    if (text !== undefined) {
      updates.push(`text = $${paramIndex}`);
      values.push(text);
      paramIndex++;
    }

    if (mediaIds !== undefined) {
      updates.push(`media_ids = $${paramIndex}`);
      values.push(mediaIds);
      paramIndex++;
    }

    if (audiencePercentage !== undefined) {
      updates.push(`audience_percentage = $${paramIndex}`);
      values.push(audiencePercentage);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);
    const result = await query(
      `UPDATE content_variations 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return NextResponse.json({
      success: true,
      variation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating variation:', error);
    return NextResponse.json(
      { error: 'Failed to update variation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      'DELETE FROM content_variations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Variation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variation:', error);
    return NextResponse.json(
      { error: 'Failed to delete variation' },
      { status: 500 }
    );
  }
}
