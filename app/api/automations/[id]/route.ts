/**
 * Automation API Routes (by ID)
 * GET /api/automations/[id] - Get a specific automation
 * PUT /api/automations/[id] - Update an automation
 * DELETE /api/automations/[id] - Delete an automation
 * 
 * Requirements: 1.4, 1.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { automationService } from '@/lib/automations/automation.service';
import type { UpdateAutomationInput } from '@/lib/automations/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/automations/[id]
 * Get a specific automation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(session.user.id, 10);
    const automation = await automationService.getFlow(id);

    if (!automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (automation.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: automation,
    });
  } catch (error) {
    console.error('Error getting automation:', error);
    return NextResponse.json(
      { error: 'Failed to get automation' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/automations/[id]
 * Update an automation
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(session.user.id, 10);
    
    // Check ownership first
    const existing = await automationService.getFlow(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json() as UpdateAutomationInput;
    const automation = await automationService.updateFlow(id, body);

    return NextResponse.json({
      success: true,
      data: automation,
    });
  } catch (error) {
    console.error('Error updating automation:', error);
    
    if (error instanceof Error && error.message.includes('Invalid automation flow')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automations/[id]
 * Delete an automation
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(session.user.id, 10);
    
    // Check ownership first
    const existing = await automationService.getFlow(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await automationService.deleteFlow(id);

    return NextResponse.json({
      success: true,
      message: 'Automation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}
