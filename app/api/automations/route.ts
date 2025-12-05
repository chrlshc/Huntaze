/**
 * Automations API Routes
 * GET /api/automations - List automations for current user
 * POST /api/automations - Create a new automation
 * 
 * Requirements: 1.4, 1.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { automationService } from '@/lib/automations/automation.service';
import type { AutomationStatus, CreateAutomationInput } from '@/lib/automations/types';

/**
 * GET /api/automations
 * List all automations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as AutomationStatus | null;

    const automations = await automationService.listFlows(
      userId,
      status || undefined
    );

    return NextResponse.json({
      success: true,
      data: automations,
    });
  } catch (error) {
    console.error('Error listing automations:', error);
    return NextResponse.json(
      { error: 'Failed to list automations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automations
 * Create a new automation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json() as CreateAutomationInput;

    // Validate required fields
    if (!body.name || !body.steps) {
      return NextResponse.json(
        { error: 'Name and steps are required' },
        { status: 400 }
      );
    }

    const automation = await automationService.createFlow(userId, body);

    return NextResponse.json({
      success: true,
      data: automation,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    
    if (error instanceof Error && error.message.includes('Invalid automation flow')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}
