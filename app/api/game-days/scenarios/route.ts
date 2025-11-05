/**
 * Game Day Scenarios API
 * Manage and execute disaster recovery scenarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { scenarioRunner, GameDayScenario, ScenarioType } from '@/lib/game-days/scenarioRunner';

// GET /api/game-days/scenarios - List all scenarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ScenarioType;
    const environment = searchParams.get('environment');

    let scenarios = scenarioRunner.getAllScenarios();

    // Filter by type if specified
    if (type) {
      scenarios = scenarios.filter(s => s.type === type);
    }

    // Filter by environment if specified
    if (environment) {
      scenarios = scenarios.filter(s => s.environment === environment);
    }

    return NextResponse.json({
      success: true,
      data: scenarios,
      count: scenarios.length
    });
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

// POST /api/game-days/scenarios - Create new scenario
export async function POST(request: NextRequest) {
  try {
    const scenario: GameDayScenario = await request.json();

    // Validate scenario
    if (!scenario.id || !scenario.name || !scenario.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, type' },
        { status: 400 }
      );
    }

    // Register scenario
    scenarioRunner.registerScenario(scenario);

    return NextResponse.json({
      success: true,
      data: scenario,
      message: 'Scenario created successfully'
    });
  } catch (error) {
    console.error('Failed to create scenario:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}