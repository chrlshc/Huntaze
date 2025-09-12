import { DEFAULTS } from '@/src/lib/onboarding/config'
import { useOnboarding } from '@/src/hooks/useOnboarding'

/**
 * Runs the mock auto-calibration after OnlyFans connect.
 * Applies 4 MVP rules: heatmap hours, volume up/down, early VIP, IG/TT risk.
 */
export async function runAutoCalibrationMock() {
  try {
    const res = await fetch('/api/onboarding/mock-ingest')
    if (!res.ok) return false
    const mock = await res.json()
    const { updateOps, updateSegmentation, updateBoundaries, updateMonetization } = useOnboarding.getState()

    // PPV anchors (typical) — clamp and adjust
    if (typeof mock.ppvAnchor === 'number') {
      const typical = Math.round(mock.ppvAnchor)
      const min = Math.max(DEFAULTS.ppv.min, Math.round(typical * 0.33))
      const max = Math.round(typical * 2.5)
      updateMonetization({ ppvRange: { min, typical, max } })
    }

    // Heatmap → active hours
    if (Array.isArray(mock.peakHours) && mock.peakHours.length > 0) {
      const h = mock.peakHours[0]
      updateOps({ activeHours: [{ start: h.start, end: h.end }] })
    }

    // Volume up/down
    if (mock.sendVolume === 'high') {
      updateOps({ dailyCaps: { global: DEFAULTS.caps.dailyGlobal, vip: DEFAULTS.caps.dailyVip } })
    } else if (mock.sendVolume === 'low') {
      updateOps({ reengageWindows: [...DEFAULTS.reengage.windows] as any })
    }

    // Early VIP
    if (mock.suggestLowerWhaleThreshold) {
      updateSegmentation({ whaleThreshold: mock.suggestLowerWhaleThreshold })
    }

    // IG/TT risk → soft‑sell flags
    if (mock.igRisk || mock.ttRisk) {
      updateBoundaries({ platformRulesFlags: { IG: !!mock.igRisk, TT: !!mock.ttRisk } })
    }
    return true
  } catch {
    return false
  }
}

