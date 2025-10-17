import { popDue, scheduleMember, computeNextSeconds } from '@/src/lib/insights/scheduler'
import { tiktokVideoQuery, normalizeTikTokVideo } from '@/src/lib/tiktok/insights'
import { saveTikTokVideoSnapshot } from '@/src/lib/tiktok/insightsStore'
import { fetchIgMediaInsights } from '@/src/lib/instagram/insights'
import { saveIgMediaSnapshot } from '@/src/lib/instagram/store'
import { prom } from '@/src/lib/prom'

export async function processInsightsSchedule(limit = 100) {
  const entries = await popDue(limit)
  const queue = 'default'
  prom.gauges.schedulerInflight.labels({ queue }).set(entries.length)
  let processed = 0
  const nowMs = Date.now()
  const nowSec = Math.floor(nowMs / 1000)
  let lagSum = 0

  for (const { member, score } of entries) {
    try {
      if (member.startsWith('tiktok:video:')) {
        const id = member.slice('tiktok:video:'.length)
        if (process.env.TT_USER_TOKEN) {
          const res = await tiktokVideoQuery({ userAccessToken: process.env.TT_USER_TOKEN, ids: [id], fields: ['id','create_time','like_count','comment_count','share_count','view_count'] })
          const v = res.items[0]
          if (v) {
            const n = normalizeTikTokVideo(v)
            await saveTikTokVideoSnapshot(n)
            const ageH = v?.create_time ? Math.max(0, (nowMs/1000 - v.create_time) / 3600) : 999
            const next = computeNextSeconds(ageH)
            await scheduleMember(member, next)
            processed++
            lagSum += Math.max(0, nowSec - (score || nowSec))
          }
        }
      } else if (member.startsWith('instagram:media:')) {
        const id = member.slice('instagram:media:'.length)
        if (process.env.IG_PAGE_TOKEN) {
          const m = await fetchIgMediaInsights(id, process.env.IG_PAGE_TOKEN)
          if (m) {
            await saveIgMediaSnapshot(id, m)
            const next = computeNextSeconds(999) // unknown age → long interval
            await scheduleMember(member, next)
            processed++
            lagSum += Math.max(0, nowSec - (score || nowSec))
          }
        }
      }
    } catch {
      // On error, reschedule in ~15 min
      await scheduleMember(member, 900)
    }
  }
  if (processed) prom.counters.schedulerRuns.labels({ queue }).inc(1)
  const avgLag = entries.length ? lagSum / entries.length : 0
  prom.gauges.schedulerLag.labels({ queue }).set(avgLag)
  prom.gauges.schedulerInflight.labels({ queue }).set(0)
  return { processed }
}
