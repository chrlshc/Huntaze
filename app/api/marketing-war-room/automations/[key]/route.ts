import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/marketing-war-room/automations/:key
 * 
 * Toggle an automation feature flag on/off.
 * Body: { enabled: boolean }
 * 
 * This controls server-side pipelines. The React app never publishes directly
 * (tokens are protected on the backend).
 */

interface AutomationConfig {
  enabled: boolean;
  label: string;
  description: string;
  compliance: string;
}

// In-memory store for demo (replace with database in production)
const automationsStore: Record<string, AutomationConfig> = {
  instagram_welcome_dm: {
    enabled: true,
    label: 'Instagram Welcome DM',
    description: 'Welcome flow compliant (opt-in / conversation window). Pas de DM blast aux nouveaux follows.',
    compliance: 'api_only',
  },
  tiktok_warmup: {
    enabled: false,
    label: 'TikTok Warmup',
    description: 'Mode compliant: plan de cadence + checks. Pas d\'auto-scroll.',
    compliance: 'api_only',
  },
  auto_reposter: {
    enabled: true,
    label: 'Auto-Reposter',
    description: '1 asset → multi-platform publish (TikTok + Reels) via APIs officielles.',
    compliance: 'api_only',
  },
};

// TODO: Replace with actual database operations
async function updateAutomationInDB(key: string, enabled: boolean): Promise<AutomationConfig | null> {
  // In production:
  // UPDATE automations SET enabled = $2, updated_at = NOW() WHERE key = $1 RETURNING *
  // Also log to audit table:
  // INSERT INTO automation_audit_log (automation_key, action, enabled, user_id, timestamp)
  // VALUES ($1, 'toggle', $2, $3, NOW())
  
  if (!automationsStore[key]) {
    return null;
  }
  
  automationsStore[key].enabled = enabled;
  
  // Log the change (in production, write to audit_log table)
  console.log(`[automation-toggle] ${key} -> ${enabled ? 'ENABLED' : 'DISABLED'} at ${new Date().toISOString()}`);
  
  return automationsStore[key];
}

async function getAllAutomations(): Promise<Record<string, AutomationConfig>> {
  // In production: SELECT * FROM automations
  return { ...automationsStore };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid "enabled" field (must be boolean)' },
        { status: 400 }
      );
    }

    const updated = await updateAutomationInDB(key, body.enabled);
    
    if (!updated) {
      return NextResponse.json(
        { error: `Automation "${key}" not found` },
        { status: 404 }
      );
    }

    // Return updated automations state
    const automations = await getAllAutomations();
    
    return NextResponse.json({
      success: true,
      key,
      enabled: body.enabled,
      automations,
    });
  } catch (error) {
    console.error('[marketing-war-room/automations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle automation' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    if (!automationsStore[key]) {
      return NextResponse.json(
        { error: `Automation "${key}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key,
      ...automationsStore[key],
    });
  } catch (error) {
    console.error('[marketing-war-room/automations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get automation' },
      { status: 500 }
    );
  }
}
