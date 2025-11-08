/**
 * Game Day Execution API
 * Start, monitor, and control game day executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarioRunner, startGameDay, abortGameDay, GameDayParticipant } from '@/lib/game-days/scenarioRunner';
import { scheduleAAR } from '@/lib/game-days/afterActionReview';

// GET /api/game-days/execution - List executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const active = searchParams.get('active') === 'true';

    let executions = scenarioRunner.getAllExecutions();

    if (active) {
      executions = scenarioRunner.getActiveExecutions();
    } else if (status) {
      executions = executions.filter(e => e.status === status);
    }

    return NextResponse.json({
      success: true,
      data: executions,
      count: executions.length
    });
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}

// POST /api/game-days/execution - Start new game day
export async function POST(request: NextRequest) {
  try {
    const {
      scenarioId,
      participants,
      options = {}
    }: {
      scenarioId: string;
      participants: GameDayParticipant[];
      options?: {
        dryRun?: boolean;
        skipSafetyChecks?: boolean;
        customDuration?: number;
      };
    } = await request.json();

    // Validate input
    if (!scenarioId || !participants || participants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scenarioId, participants' },
        { status: 400 }
      );
    }

    // Check if scenario exists
    const scenario = scenarioRunner.getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { success: false, error: `Scenario ${scenarioId} not found` },
        { status: 404 }
      );
    }

    // Start game day
    const executionId = await startGameDay(scenarioId, participants, options);
    const execution = scenarioRunner.getExecution(executionId);

    // Schedule AAR for after completion
    if (execution && !options.dryRun) {
      const aarScheduledAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours after start
      await scheduleAAR(
        {
          executionId,
          scenarioName: scenario.name,
          date: execution.startTime,
          duration: scenario.duration,
          participants: participants.map(p => p.name)
        },
        'standard',
        'Game Master',
        aarScheduledAt
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        execution,
        message: 'Game day started successfully'
      }
    });
  } catch (error) {
    console.error('Failed to start game day:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to start game day' },
      { status: 500 }
    );
  }
}

// DELETE /api/game-days/execution/[id] - Abort game day
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const executionId = url.pathname.split('/').pop();
    const { reason = 'Manual abort' } = await request.json().catch(() => ({}));

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'Execution ID required' },
        { status: 400 }
      );
    }

    await abortGameDay(executionId, reason);

    return NextResponse.json({
      success: true,
      message: 'Game day aborted successfully'
    });
  } catch (error) {
    console.error('Failed to abort game day:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to abort game day' },
      { status: 500 }
    );
  }
}