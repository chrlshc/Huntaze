import { NextResponse } from 'next/server'
import { withMonitoring } from '@/lib/observability/bootstrap'

export const runtime = 'nodejs'

// Mock ingestion of OnlyFans stats to drive auto-calibration rules
// In production, this would read creator analytics and return structured KPIs

async function handler() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  // Simple deterministic mock for now
  const mock = {
    ppvAnchor: 20, // typical historical PPV that converts well
    peakHours: [
      { start: '20:00', end: '22:00', tz: 'America/New_York' },
    ],
    sendVolume: 'high' as 'low' | 'high',
    whalePercent: 0.05,
    suggestLowerWhaleThreshold: 400,
    igRisk: false,
    ttRisk: false,
  }
  return NextResponse.json(mock)
}

export const GET = withMonitoring('onboarding.mock-ingest', handler as any)
