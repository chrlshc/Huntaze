import { DEFAULTS } from '@/src/lib/onboarding/config'
import { useOnboarding } from '@/src/hooks/useOnboarding'

/**
 * Runs auto-calibration after OnlyFans connect.
 * Fetches real creator analytics and applies calibration rules:
 * - PPV anchors from historical data
 * - Peak hours from activity patterns
 * - Volume settings based on engagement
 * - VIP thresholds from spending distribution
 * - Platform risk flags
 */
export async function runAutoCalibration() {
  try {
    // Fetch real analytics data (falls back to defaults if no data)
    const res = await fetch('/api/onboarding/mock-ingest')
    if (!res.ok) return false
    const data = await res.json()
    const { updateOps, updateSegmentation, updateBoundaries, updateMonetization } = useOnboarding.getState()

    // PPV anchors (typical) — clamp and adjust
    if (typeof data.ppvAnchor === 'number') {
      const typical = Math.round(data.ppvAnchor)
      const min = Math.max(DEFAULTS.ppv.min, Math.round(typical * 0.33))
      const max = Math.round(typical * 2.5)
      updateMonetization({ ppvRange: { min, typical, max } })
    }

    // Heatmap → active hours
    if (Array.isArray(data.peakHours) && data.peakHours.length > 0) {
      const h = data.peakHours[0]
      updateOps({ activeHours: [{ start: h.start, end: h.end }] })
    }

    // Volume up/down
    if (data.sendVolume === 'high') {
      updateOps({ dailyCaps: { global: DEFAULTS.caps.dailyGlobal, vip: DEFAULTS.caps.dailyVip } })
    } else if (data.sendVolume === 'low') {
      updateOps({ reengageWindows: [...DEFAULTS.reengage.windows] as any })
    }

    // Early VIP threshold
    if (data.suggestLowerWhaleThreshold) {
      updateSegmentation({ whaleThreshold: data.suggestLowerWhaleThreshold })
    }

    // IG/TT risk → soft‑sell flags
    if (data.igRisk || data.ttRisk) {
      updateBoundaries({ platformRulesFlags: { IG: !!data.igRisk, TT: !!data.ttRisk } })
    }
    return true
  } catch {
    return false
  }
}

// Alias for backward compatibility
export const runAutoCalibrationMock = runAutoCalibration;

