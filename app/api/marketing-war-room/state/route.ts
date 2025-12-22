import { NextResponse } from 'next/server';
import { isMockApiMode } from '@/config/api-mode';

/**
 * GET /api/marketing-war-room/state
 * 
 * Returns the current state for the Marketing War Room dashboard:
 * - queue: Content items being processed
 * - automations: Feature flags for server-side pipelines
 * - health: Account health checks (tokens, quotas, errors, cadence)
 * - trends: Trend suggestions (fed by internal analytics, not scraping)
 */

// Types
interface QueueItem {
  id: string;
  title: string;
  scheduledAt: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
  steps: { key: string; label: string; status: string }[];
  lastUpdateAt: string;
  error?: string;
}

interface Automation {
  enabled: boolean;
  label: string;
  description: string;
  compliance: string;
}

interface HealthCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface Health {
  status: 'secure' | 'warning' | 'risk' | 'unknown';
  label: string;
  details: string;
  checks: HealthCheck[];
}

interface Trend {
  id: string;
  title: string;
  why: string;
  example?: string;
}

interface WarRoomState {
  queue: QueueItem[];
  automations: Record<string, Automation>;
  health: Health;
  trends: Trend[];
}

// TODO: Replace with actual database queries
async function getQueueFromDB(): Promise<QueueItem[]> {
  // In production, query from:
  // SELECT ci.*, pp.status, pp.platform, pj.status as job_status
  // FROM content_items ci
  // LEFT JOIN platform_publications pp ON pp.content_item_id = ci.id
  // LEFT JOIN publish_jobs pj ON pj.content_item_id = ci.id
  // WHERE ci.status IN ('scheduled', 'in_progress')
  // ORDER BY ci.schedule_at DESC
  // LIMIT 50
  
  return [
    {
      id: 'post_001',
      title: 'Reel: Hook + CTA',
      scheduledAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      platforms: ['tiktok', 'instagram'],
      status: 'processing',
      steps: [
        { key: 'render', label: 'Render variants', status: 'posted' },
        { key: 'tiktok', label: 'TikTok Direct Post', status: 'processing' },
        { key: 'ig', label: 'IG Container → Publish', status: 'scheduled' },
      ],
      lastUpdateAt: new Date().toISOString(),
    },
    {
      id: 'post_002',
      title: 'Story: Proof social',
      scheduledAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      platforms: ['instagram'],
      status: 'scheduled',
      steps: [{ key: 'ig', label: 'IG Publish', status: 'scheduled' }],
      lastUpdateAt: new Date().toISOString(),
    },
  ];
}

// TODO: Replace with actual database queries
async function getAutomationsFromDB(): Promise<Record<string, Automation>> {
  // In production, query from:
  // SELECT * FROM automations
  
  return {
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
}

// TODO: Replace with actual health checks
async function computeHealth(): Promise<Health> {
  // In production:
  // 1. Check token validity: SELECT * FROM oauth_tokens WHERE expires_at < NOW() + INTERVAL '1 day'
  // 2. Check error rate: SELECT COUNT(*) FROM publish_jobs WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'
  // 3. Check rate limits: Query platform APIs or cached limits
  // 4. Check cadence: Verify publishing frequency is within safe bounds
  
  const checks: HealthCheck[] = [
    { key: 'tokens', label: 'Tokens valides', ok: true, detail: 'TikTok + IG' },
    { key: 'rate', label: 'Rate limits', ok: true, detail: 'Dans les clous' },
    { key: 'errors', label: 'Taux d\'échec 24h', ok: true, detail: '< 2%' },
    { key: 'cadence', label: 'Cadence publishing', ok: true, detail: 'Safe ramp' },
  ];
  
  const allOk = checks.every(c => c.ok);
  const someWarnings = checks.some(c => !c.ok);
  
  return {
    status: allOk ? 'secure' : someWarnings ? 'warning' : 'risk',
    label: allOk ? 'Secure' : someWarnings ? 'Warning' : 'At Risk',
    details: allOk ? 'Tokens OK • Quotas OK • Error rate OK • Cadence OK' : 'Some checks need attention',
    checks,
  };
}

// TODO: Replace with actual trend data
async function getTrends(): Promise<Trend[]> {
  // In production, this comes from:
  // 1. Your own analytics (top performing content patterns)
  // 2. Team notes / curation
  // 3. TikTok Creative Center insights (manual input, not scraping)
  
  return [
    { 
      id: 't1', 
      title: 'Hook 0–1s + sous-titres', 
      why: 'Boost watch time, meilleur cross-post Reels/TikTok', 
      example: '"Stop scrolling si tu fais X…"' 
    },
    { 
      id: 't2', 
      title: 'Series content (épisodes)', 
      why: 'Structure, retention, re-use en calendar', 
      example: 'Épisode 1/7 : …' 
    },
  ];
}

export async function GET() {
  try {
    if (!isMockApiMode()) {
      const state: WarRoomState = {
        queue: [],
        automations: {},
        health: {
          status: 'unknown',
          label: 'Unknown',
          details: 'No health data available',
          checks: [],
        },
        trends: [],
      };
      return NextResponse.json(state);
    }

    // Fetch all data in parallel
    const [queue, automations, health, trends] = await Promise.all([
      getQueueFromDB(),
      getAutomationsFromDB(),
      computeHealth(),
      getTrends(),
    ]);

    const state: WarRoomState = {
      queue,
      automations,
      health,
      trends,
    };

    return NextResponse.json(state);
  } catch (error) {
    console.error('[marketing-war-room/state] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch war room state' },
      { status: 500 }
    );
  }
}
