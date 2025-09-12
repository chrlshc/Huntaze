import { NextResponse } from 'next/server'

// Mock ingestion of OnlyFans stats to drive auto-calibration rules
// In production, this would read creator analytics and return structured KPIs

export async function GET() {
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

